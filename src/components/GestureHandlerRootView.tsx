import {ReactNativeViewAttributes, registerViewConfig} from "react-native-harmony"
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import { maybeInitializeFabric } from '../init';
import GestureHandlerRootViewContext from 'react-native-gesture-handler/src/GestureHandlerRootViewContext';


const GestureHandlerRootViewNativeComponent = registerViewConfig('RNGestureHandlerRootView', () => ({
  uiViewClassName: 'RNGestureHandlerRootView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    ...ReactNativeViewAttributes.UIView,
  },
}));

export interface GestureHandlerRootViewProps
  extends PropsWithChildren<ViewProps> {}

export default function GestureHandlerRootView(
  props: GestureHandlerRootViewProps
) {
  // try initialize fabric on the first render, at this point we can
  // reliably check if fabric is enabled (the function contains a flag
  // to make sure it's called only once)
  maybeInitializeFabric(); 

  return (
    <GestureHandlerRootViewContext.Provider value>
      <GestureHandlerRootViewNativeComponent {...props} />
    </GestureHandlerRootViewContext.Provider>
  );
}
