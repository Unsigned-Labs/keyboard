package `in`.unsigned.keyboard

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView

class WelcomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_welcome)

        findViewById<TextView>(R.id.welcomeMessage).text = "Welcome to Unsigned Keyboard!"
    }
}