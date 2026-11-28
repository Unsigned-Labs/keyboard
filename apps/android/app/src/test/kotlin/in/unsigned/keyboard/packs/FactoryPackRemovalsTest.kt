package `in`.unsigned.keyboard.packs

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FactoryPackRemovalsTest {
    @get:Rule val folder = TemporaryFolder()

    @Test fun removalSurvivesRepositoryRestartAndIsSpecificToTheFactoryId() {
        val dir = folder.newFolder()
        FactoryPackRemovals(dir).remove("in.unsigned.input.en")

        val restarted = FactoryPackRemovals(dir).read()
        assertTrue("in.unsigned.input.en" in restarted)
        assertFalse("in.unsigned.input.as.native" in restarted)
    }

    @Test fun restoreDoesNotBringBackOtherRemovedPacks() {
        val dir = folder.newFolder()
        FactoryPackRemovals(dir).remove("in.unsigned.input.en")
        FactoryPackRemovals(dir).remove("in.unsigned.input.as.native")
        FactoryPackRemovals(dir).restore("in.unsigned.input.en")

        val restarted = FactoryPackRemovals(dir).read()
        assertFalse("in.unsigned.input.en" in restarted)
        assertTrue("in.unsigned.input.as.native" in restarted)
    }
}
