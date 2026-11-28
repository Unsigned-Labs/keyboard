#!/usr/bin/env python3
"""IBus Engine for Unsigned Keyboard Input Method"""

import json
import os
import subprocess
import sys
from gi import require_version
require_version('IBus', '1.0')
from gi.repository import IBus, GLib

# IBus engine name -> input method pack id.
INPUT_METHODS = {
    "unsigned-assamese": "in.unsigned.input.as.phonetic",
    "unsigned-bangla": "in.unsigned.input.bn.phonetic",
    "unsigned-hindi": "in.unsigned.input.hi.phonetic",
}

SELECT_KEYS = {getattr(IBus, f"KEY_{n}"): n - 1 for n in range(1, 10)}


def find_engine_binary():
    """Find the Rust engine binary."""
    here = os.path.dirname(os.path.abspath(__file__))
    paths = [
        "/usr/local/bin/ibus-engine-unsigned",
        "/usr/bin/ibus-engine-unsigned",
        os.path.expanduser("~/.local/bin/ibus-engine-unsigned"),
        os.path.join(here, "target/release/ibus-engine-unsigned"),
        os.path.join(here, "../target/release/ibus-engine-unsigned"),
    ]
    for path in paths:
        if os.path.exists(path):
            return path
    return "ibus-engine-unsigned"


class Backend:
    """One long-running Rust engine process, restarted if it dies."""

    def __init__(self):
        self.proc = None

    def _start(self):
        self.proc = subprocess.Popen(
            [find_engine_binary()],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self.proc.stdout.readline()  # READY

    def ask(self, line):
        for _ in range(2):
            try:
                if self.proc is None or self.proc.poll() is not None:
                    self._start()
                self.proc.stdin.write(line + "\n")
                self.proc.stdin.flush()
                return self.proc.stdout.readline().rstrip("\n")
            except (OSError, ValueError) as e:
                print(f"engine error: {e}", file=sys.stderr)
                self.proc = None
        return ""


BACKEND = Backend()


class UnsignedEngine(IBus.Engine):
    """Transliterating input method with dictionary suggestions."""

    def __init__(self):
        super().__init__()
        self.buffer = ""
        self.candidates = []
        self.table = IBus.LookupTable.new(9, 0, True, True)
        self.table.set_orientation(IBus.Orientation.HORIZONTAL)

    def _input_method(self):
        try:
            name = self.get_name()
        except Exception:
            name = ""
        return INPUT_METHODS.get(name, INPUT_METHODS["unsigned-assamese"])

    def _refresh(self):
        if not self.buffer:
            self.candidates = []
            self.hide_preedit_text()
            self.hide_lookup_table()
            return
        BACKEND.ask(f"SET_INPUT_METHOD {self._input_method()}")
        reply = BACKEND.ask(f"CANDIDATES {self.buffer}")
        try:
            self.candidates = [c["text"] for c in json.loads(reply.split(" ", 1)[1])]
        except (IndexError, ValueError, KeyError):
            self.candidates = []
        if not self.candidates:
            self.candidates = [self.buffer]

        self.table.clear()
        for text in self.candidates:
            self.table.append_candidate(IBus.Text.new_from_string(text))
        self.table.set_cursor_pos(0)
        self.update_lookup_table(self.table, len(self.candidates) > 1)
        self._show_preedit()

    def _show_preedit(self):
        text = self.candidates[self.table.get_cursor_pos()] if self.candidates else self.buffer
        preedit = IBus.Text.new_from_string(text)
        attrs = IBus.AttrList()
        attrs.append(IBus.attr_underline_new(IBus.AttrUnderline.SINGLE, 0, len(text)))
        preedit.set_attributes(attrs)
        self.update_preedit_text(preedit, len(text), True)

    def _commit(self, index=None):
        if not self.buffer:
            return
        if index is None:
            index = self.table.get_cursor_pos()
        text = self.candidates[index] if 0 <= index < len(self.candidates) else self.buffer
        self.commit_text(IBus.Text.new_from_string(text))
        self._clear()

    def _clear(self):
        self.buffer = ""
        self.candidates = []
        self.hide_preedit_text()
        self.hide_lookup_table()

    def do_process_key_event(self, keyval, keycode, state):
        if state & IBus.ModifierType.RELEASE_MASK:
            return False
        if state & (IBus.ModifierType.CONTROL_MASK | IBus.ModifierType.MOD1_MASK):
            return False

        if self.buffer:
            if keyval in SELECT_KEYS and SELECT_KEYS[keyval] < len(self.candidates):
                self._commit(SELECT_KEYS[keyval])
                return True
            if keyval in (IBus.KEY_Right, IBus.KEY_Down, IBus.KEY_Tab):
                self.table.cursor_down()
                self.update_lookup_table(self.table, True)
                self._show_preedit()
                return True
            if keyval in (IBus.KEY_Left, IBus.KEY_Up, IBus.KEY_ISO_Left_Tab):
                self.table.cursor_up()
                self.update_lookup_table(self.table, True)
                self._show_preedit()
                return True

        if keyval == IBus.KEY_BackSpace:
            if self.buffer:
                self.buffer = self.buffer[:-1]
                self._refresh()
                return True
            return False

        if keyval == IBus.KEY_space:
            if self.buffer:
                self._commit()
                self.commit_text(IBus.Text.new_from_string(" "))
                return True
            return False

        if keyval in (IBus.KEY_Return, IBus.KEY_KP_Enter):
            if self.buffer:
                self._commit()
                return True
            return False

        if keyval == IBus.KEY_Escape:
            if self.buffer:
                self._clear()
                return True
            return False

        if 0x21 <= keyval <= 0x7E:
            self.buffer += chr(keyval)
            self._refresh()
            return True

        if self.buffer:
            self._commit()
        return False

    def do_candidate_clicked(self, index, button, state):
        self._commit(self.table.get_cursor_pos() // 9 * 9 + index)

    def do_focus_in(self):
        self._clear()

    def do_focus_out(self):
        self._commit()

    def do_reset(self):
        self._clear()

    def do_enable(self):
        pass

    def do_disable(self):
        self._commit()


class IMApp:
    """Main IBus application"""

    def __init__(self, exec_by_ibus):
        self.mainloop = GLib.MainLoop()
        self.bus = IBus.Bus()
        self.bus.connect("disconnected", self._bus_disconnected_cb)
        self.factory = IBus.Factory.new(self.bus.get_connection())

        # Register engines
        self.factory.add_engine("unsigned-assamese",
                               UnsignedEngine.__gtype__)
        self.factory.add_engine("unsigned-bangla",
                               UnsignedEngine.__gtype__)
        self.factory.add_engine("unsigned-hindi",
                               UnsignedEngine.__gtype__)

        if exec_by_ibus:
            self.bus.request_name("in.unsigned.IBus.Unsigned", 0)
        else:
            self.bus.register_component(self._get_component())

    def _get_component(self):
        """Create IBus component description"""
        engine_dir = os.path.dirname(__file__)

        component = IBus.Component.new(
            "in.unsigned.IBus.Unsigned",
            "Unsigned Keyboard",
            "0.1.0",
            "MIT",
            "Unsigned Labs",
            "https://keyboard.unsigned.in",
            sys.argv[0],
            "unsigned-keyboard"
        )

        # Assamese engine
        assamese = IBus.EngineDesc.new(
            "unsigned-assamese",
            "Assamese (Unsigned)",
            "Assamese transliteration input method",
            "as",
            "MIT",
            "Unsigned Labs",
            "",
            "as"
        )
        component.add_engine(assamese)

        # Bangla engine
        bangla = IBus.EngineDesc.new(
            "unsigned-bangla",
            "Bangla (Unsigned)",
            "Bangla transliteration input method",
            "bn",
            "MIT",
            "Unsigned Labs",
            "",
            "bn"
        )
        component.add_engine(bangla)

        # Hindi engine
        hindi = IBus.EngineDesc.new(
            "unsigned-hindi",
            "Hindi (Unsigned)",
            "Hindi transliteration input method",
            "hi",
            "MIT",
            "Unsigned Labs",
            "",
            "hi"
        )
        component.add_engine(hindi)

        return component

    def _bus_disconnected_cb(self, bus):
        """Handle bus disconnection"""
        self.mainloop.quit()

    def run(self):
        """Run the main loop"""
        self.mainloop.run()


if __name__ == "__main__":
    IBus.init()
    exec_by_ibus = "--ibus" in sys.argv
    app = IMApp(exec_by_ibus)
    app.run()
