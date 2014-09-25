package myapplication.sample1.app;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    public void startBluetooth(View view) {

        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        if (bluetoothAdapter == null) {
            ((TextView)findViewById(R.id.textView)).append("Bluetooth are not found!!!");
        } else {
            ((TextView)findViewById(R.id.textView)).append("Bluetooth are found!!!");
        }

    }
}
