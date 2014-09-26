package util;

import java.util.Observable;
import java.util.Observer;

public class MyObservable extends Observable {

    @Override
    public boolean hasChanged() {
        return true;
    }

}
