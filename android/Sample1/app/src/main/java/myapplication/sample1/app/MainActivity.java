package myapplication.sample1.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import java.util.Observable;
import java.util.Observer;

public class MainActivity extends Activity implements Observer {

    private BluetoothService bluetoothService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    @Override
    protected void onStart() {
        super.onStart();
        bluetoothService = new BluetoothService(this);
        bluetoothService.addObserver(this);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Bluetooth activity result
    }

    public void startBluetooth(View view) {
        bluetoothService.startBluetooth(view);
    }

    @Override
    public void update(Observable observable, Object data) {
        ((TextView)findViewById(R.id.textView)).append((StringBuffer)data);
    }
}
