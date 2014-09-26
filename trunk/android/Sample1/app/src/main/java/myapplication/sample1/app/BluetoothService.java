package myapplication.sample1.app;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Intent;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import java.util.Set;


public class BluetoothService {

    private Activity activity;

    private BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

    public BluetoothService (Activity activity) {
        this.activity = activity;
    }

    public void startBluetooth (View view) {

        TextView textView = (TextView) activity.findViewById(R.id.textView);
        EditText editText = (EditText) activity.findViewById(R.id.editText);

        if (bluetoothAdapter == null) {
            textView.append(editText.getText().toString() + '\n');
            textView.append("No Bluetooth found!!!" + '\n');
        } else {
            textView.append("Bluetooth found!");
        }
    }

    private void checkBluetooth(BluetoothAdapter bluetoothAdapter) {
        if (!bluetoothAdapter.isEnabled()) {
            Intent bluetoothIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            activity.startActivityForResult(bluetoothIntent, 1);
        }
    }


    public void findBluetoothDevice() {
        Set<BluetoothDevice> devices =  bluetoothAdapter.getBondedDevices();

        if (!devices.isEmpty()) {
            BluetoothDevice device = devices.iterator().next();

        }

    }
}
