package `in`.unsigned.keyboard.theme

import org.junit.Assert.assertEquals
import org.junit.Test

class AppThemeTest {
    @Test fun existingExplicitThemeOverridesTheSystem() {
        assertEquals(false, AppTheme.isDark("DEFAULT_LIGHT", systemDark = true))
        assertEquals(true, AppTheme.isDark("DEFAULT_DARK", systemDark = false))
    }

    @Test fun systemAndUnknownOrUnsetThemesFollowDeviceAppearance() {
        for (mode in listOf("SYSTEM", null, "legacy-unknown")) {
            assertEquals(true, AppTheme.isDark(mode, systemDark = true))
            assertEquals(false, AppTheme.isDark(mode, systemDark = false))
        }
    }
}
