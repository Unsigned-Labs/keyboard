package `in`.unsigned.keyboard.layout

import android.graphics.RectF

data class ComputedKey(val bounds: RectF, val key: Key, val label: String)

/** Places a page's keys: widths are in key units, rows are centred, and every key shares one unit. */
class LayoutEngine(private val keyboardWidth: Int, private val keyboardHeight: Int) {
    private val horizontalGap = 6f
    private val verticalGap = 8f

    fun computeLayout(page: LayoutPage, rowCount: Int, shifted: Boolean): List<ComputedKey> {
        val unit = keyboardWidth / page.rows.maxOf { it.units }.coerceAtLeast(1f)
        val rowHeight = keyboardHeight / rowCount.coerceAtLeast(page.rows.size).toFloat()
        val top = keyboardHeight - rowHeight * page.rows.size
        val keys = mutableListOf<ComputedKey>()

        page.rows.forEachIndexed { index, row ->
            val y = top + index * rowHeight
            var x = (keyboardWidth - row.units * unit) / 2f + row.offset * unit
            for (key in row.keys) {
                val w = key.width * unit
                keys += ComputedKey(
                    bounds = RectF(
                        x + horizontalGap / 2,
                        y + verticalGap / 2,
                        x + w - horizontalGap / 2,
                        y + rowHeight - verticalGap / 2
                    ),
                    key = key,
                    label = key.labelFor(shifted)
                )
                x += w
            }
        }
        return keys
    }
}
