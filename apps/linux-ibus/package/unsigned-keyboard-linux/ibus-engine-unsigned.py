#!/usr/bin/env python3
"""IBus Engine for Unsigned Keyboard Input Method"""

import os
import sys
import subprocess
from gi import require_version
require_version('IBus', '1.0')
from gi.repository import IBus, GLib

class UnsignedEngine(IBus.Engine):
    """Input Method Engine for transliteration"""

    def __init__(self):
        super().__init__()
        self.preedit = ""
        self.engine_path = self._find_engine_binary()
        self.schema = "assamese"  # Default as requested

    def _find_engine_binary(self):
        """Find the Rust engine binary"""
        # Check in order: installed location, local build, development build
        paths = [
            "/usr/local/bin/ibus-engine-unsigned",
            "/usr/bin/ibus-engine-unsigned",
            os.path.expanduser("~/.local/bin/ibus-engine-unsigned"),
            os.path.join(os.path.dirname(__file__), "../target/release/ibus-engine-unsigned"),
            os.path.join(os.path.dirname(__file__), "target/release/ibus-engine-unsigned"),
        ]

        for path in paths:
            if os.path.exists(path):
                return path

        # Fallback - will fail but with clear error
        return "ibus-engine-unsigned"

    def _transliterate(self, text):
        """Call Rust backend to transliterate text"""
        try:
            result = subprocess.run(
                [self.engine_path],
                input=f"TRANSLITERATE {text}\nQUIT\n",
                capture_output=True,
                text=True,
                timeout=1
            )

            for line in result.stdout.split('\n'):
                if line.startswith('RESULT '):
                    return line[7:].strip()

            return text  # Fallback to original if no result
        except Exception as e:
            print(f"Transliteration error: {e}", file=sys.stderr)
            return text

    def do_process_key_event(self, keyval, keycode, state):
        """Handle key press events"""
        # Ignore release events
        if state & IBus.ModifierType.RELEASE_MASK:
            return False

        # Ignore modifier keys
        if state & (IBus.ModifierType.CONTROL_MASK | IBus.ModifierType.MOD1_MASK):
            return False

        # Handle backspace
        if keyval == IBus.KEY_BackSpace:
            if self.preedit:
                self.preedit = self.preedit[:-1]
                if self.preedit:
                    self._update_preedit()
                else:
                    self._clear_preedit()
                return True
            return False

        # Handle space - commit current text
        if keyval == IBus.KEY_space:
            if self.preedit:
                self._commit_preedit()
                self.commit_text(IBus.Text.new_from_string(" "))
                return True
            return False

        # Handle Enter - commit current text
        if keyval == IBus.KEY_Return:
            if self.preedit:
                self._commit_preedit()
            return False

        # Handle Escape - clear preedit
        if keyval == IBus.KEY_Escape:
            if self.preedit:
                self._clear_preedit()
                return True
            return False

        # Handle regular characters (a-z, A-Z)
        if keyval >= 0x20 and keyval <= 0x7E:
            char = chr(keyval)
            self.preedit += char
            self._update_preedit()
            return True

        return False

    def _update_preedit(self):
        """Update preedit text with transliteration"""
        transliterated = self._transliterate(self.preedit)
        attrs = IBus.AttrList()
        attrs.append(IBus.attr_underline_new(IBus.AttrUnderline.SINGLE, 0, len(transliterated)))
        text = IBus.Text.new_from_string(transliterated)
        text.set_attributes(attrs)
        self.update_preedit_text(text, len(transliterated), True)

    def _commit_preedit(self):
        """Commit the preedit text"""
        if self.preedit:
            transliterated = self._transliterate(self.preedit)
            self.commit_text(IBus.Text.new_from_string(transliterated))
            self.preedit = ""
            self.hide_preedit_text()

    def _clear_preedit(self):
        """Clear the preedit text"""
        self.preedit = ""
        self.hide_preedit_text()

    def do_focus_in(self):
        """Called when engine gets focus"""
        self._clear_preedit()

    def do_focus_out(self):
        """Called when engine loses focus"""
        self._commit_preedit()

    def do_reset(self):
        """Reset engine state"""
        self._clear_preedit()

    def do_enable(self):
        """Called when engine is enabled"""
        pass

    def do_disable(self):
        """Called when engine is disabled"""
        self._commit_preedit()


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
