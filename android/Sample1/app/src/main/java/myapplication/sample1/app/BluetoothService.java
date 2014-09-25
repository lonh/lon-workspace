package myapplication.sample1.app;

import android.bluetooth.BluetoothAdapter;
import android.view.View;
import android.widget.TextView;

/**
 * Created by lhu on 9/25/14.
 */
public class BluetoothService {


    public void startBluetooth (View view) {

        TextView textView = (TextView) view.findViewById(R.id.textView);

        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        if (bluetoothAdapter == null) {
            textView.append("No Bluetooth found!!!");
        } else {
            textView.append("Bluetooth found!");
        }
    }

}
