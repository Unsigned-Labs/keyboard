package `in`.unsigned.keyboard.layout

import android.graphics.RectF
import `in`.unsigned.keyboard.theme.KeyVisualStyle

data class ComputedKey(
    val bounds: RectF,
    val spec: KeySpec,
    val label: String,
    val keyCode: Int,
    val style: KeyVisualStyle
)

class LayoutEngine(
    private val keyboardWidth: Int,
    private val keyboardHeight: Int
) {
    private val horizontalGap = 6f
    private val verticalGap = 8f

    sealed class LayoutEntry(val width: Float) {
        class Key(val spec: KeySpec, width: Float) : LayoutEntry(width)
        class Gap(width: Float) : LayoutEntry(width)
    }

    fun computeLayout(
        layout: KeyboardLayout,
        isShifted: Boolean = false
    ): List<ComputedKey> {
        val keys = mutableListOf<ComputedKey>()

        val totalRows = layout.rows.size
        val baseRowHeight = keyboardHeight / totalRows.toFloat()

        var currentY = 0f

        layout.rows.forEach { row ->
            val rowHeight = baseRowHeight * row.heightMultiplier
            val rowEntries = computeRowEntries(row)
            val rowKeys = computeRowKeys(rowEntries, currentY, rowHeight, isShifted)
            keys.addAll(rowKeys)
            currentY += rowHeight
        }

        return keys
    }

    private fun computeRowEntries(row: KeyRow): List<LayoutEntry> {
        val regularKeyCount = row.keys.count { it.width == KeyWidth.Regular }
        val functionalKeyCount = row.keys.count { it.width == KeyWidth.Functional }
        val functionalWideKeyCount = row.keys.count { it.width == KeyWidth.FunctionalWide }
        val growKeyCount = row.keys.count { it.width == KeyWidth.Grow }

        val functionalKeyWidth = keyboardWidth * 0.1f
        val functionalWideKeyWidth = keyboardWidth * 0.14f
        
        // Calculate available width for regular keys
        val usedWidth = (functionalKeyCount * functionalKeyWidth) +
                       (functionalWideKeyCount * functionalWideKeyWidth)
        
        val availableWidth = keyboardWidth - usedWidth
        
        // Calculate regular key width based on max keys (standard QWERTY has 10)
        // This ensures keys align vertically across rows
        val maxKeysInRow = 10f
        val standardKeyWidth = keyboardWidth / maxKeysInRow
        
        val regularKeyWidth = if (regularKeyCount > 0) {
             // If we have regular keys, try to use standard width, but shrink if needed
             val neededWidth = regularKeyCount * standardKeyWidth
             if (neededWidth <= availableWidth) {
                 standardKeyWidth
             } else {
                 availableWidth / regularKeyCount
             }
        } else {
            standardKeyWidth
        }

        val growKeyWidth = if (growKeyCount > 0) {
            val remainingWidth = availableWidth - (regularKeyCount * regularKeyWidth)
            if (remainingWidth > 0) remainingWidth / growKeyCount else 0f
        } else {
            0f
        }

        // Calculate total width of keys
        val totalKeyWidth = (regularKeyCount * regularKeyWidth) +
                           (functionalKeyCount * functionalKeyWidth) +
                           (functionalWideKeyCount * functionalWideKeyWidth) +
                           (growKeyCount * growKeyWidth)

        // Distribute remaining space as padding/gaps
        val remainingSpace = keyboardWidth - totalKeyWidth
        val sidePadding = remainingSpace / 2f

        val entries = mutableListOf<LayoutEntry>()
        
        // Add left padding if needed (e.g. for centered rows)
        if (sidePadding > 1f) {
             entries.add(LayoutEntry.Gap(sidePadding))
        }

        row.keys.forEach { spec ->
            val keyWidth = when (spec.width) {
                KeyWidth.Regular -> regularKeyWidth
                KeyWidth.Functional -> functionalKeyWidth
                KeyWidth.FunctionalWide -> functionalWideKeyWidth
                KeyWidth.Grow -> growKeyWidth
            }
            entries.add(LayoutEntry.Key(spec, keyWidth))
        }
        
        // Add right padding
        if (sidePadding > 1f) {
             entries.add(LayoutEntry.Gap(sidePadding))
        }

        return entries
    }

    private fun computeRowKeys(
        entries: List<LayoutEntry>,
        y: Float,
        rowHeight: Float,
        isShifted: Boolean
    ): List<ComputedKey> {
        val keys = mutableListOf<ComputedKey>()
        var currentX = 0f

        entries.forEach { entry ->
            when (entry) {
                is LayoutEntry.Gap -> {
                    currentX += entry.width
                }
                is LayoutEntry.Key -> {
                    val spec = entry.spec
                    val keyWidth = entry.width

                    val bounds = RectF(
                        currentX + horizontalGap / 2,
                        y + verticalGap / 2,
                        currentX + keyWidth - horizontalGap / 2,
                        y + rowHeight - verticalGap / 2
                    )

                    val labelAndCode = when (spec) {
                        is KeySpec.Character -> {
                            val displayLabel = if (isShifted) spec.shiftedChar else spec.char
                            Pair(displayLabel, displayLabel.firstOrNull()?.code ?: 0)
                        }
                        is KeySpec.Functional -> Pair(spec.label, spec.keyCode)
                        is KeySpec.Action -> Pair(spec.label, spec.keyCode)
                        is KeySpec.Space -> Pair(spec.label, spec.keyCode)
                    }

                    val label = labelAndCode.first
                    val keyCode = labelAndCode.second

                    keys.add(
                        ComputedKey(
                            bounds = bounds,
                            spec = spec,
                            label = label,
                            keyCode = keyCode,
                            style = spec.style
                        )
                    )

                    currentX += keyWidth
                }
            }
        }

        return keys
    }
}
