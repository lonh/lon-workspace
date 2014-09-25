package myapplication.sample1.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;

public class MainActivity extends Activity {

    private BluetoothService bluetoothService = new BluetoothService();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    public void startBluetooth(View view) {
        bluetoothService.startBluetooth(view);
    }
}
