import * as React from 'react';
import {
  Animated,
  Platform,
  processColor,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

import createNativeWrapper from '../handlers/createNativeWrapper';
import GestureHandlerButton from './GestureHandlerButton';
import { State } from 'react-native-gesture-handler/src/State';

import {
  GestureEvent,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler/src/handlers/gestureHandlerCommon';
import {
  NativeViewGestureHandlerPayload,
  NativeViewGestureHandlerProps,
} from 'react-native-gesture-handler/src/handlers/NativeViewGestureHandler';

export interface RawButtonProps extends NativeViewGestureHandlerProps {
  /**
   * Defines if more than one button could be pressed simultaneously. By default
   * set true.
   */
  exclusive?: boolean;
  // TODO: we should transform props in `createNativeWrapper`

  /**
   * Android only.
   *
   * Defines color of native ripple animation used since API level 21.
   */
  rippleColor?: any; // it was present in BaseButtonProps before but is used here in code

  /**
   * Android only.
   *
   * Defines radius of native ripple animation used since API level 21.
   */
  rippleRadius?: number | null;

  /**
   * Android only.
   *
   * Set this to true if you want the ripple animation to render outside the view bounds.
   */
  borderless?: boolean;

  /**
   * Android only.
   *
   * Defines whether the ripple animation should be drawn on the foreground of the view.
   */
  foreground?: boolean;

  /**
   * Android only.
   *
   * Set this to true if you don't want the system to play sound when the button is pressed.
   */
  touchSoundDisabled?: boolean;
}

export interface BaseButtonProps extends RawButtonProps {
  /**
   * Called when the button gets pressed (analogous to `onPress` in
   * `TouchableHighlight` from RN core).
   */
  onPress?: (pointerInside: boolean) => void;

  /**
   * Called when the button gets pressed and is held for `delayLongPress`
   * milliseconds.
   */
  onLongPress?: () => void;

  /**
   * Called when button changes from inactive to active and vice versa. It
   * passes active state as a boolean variable as a first parameter for that
   * method.
   */
  onActiveStateChange?: (active: boolean) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;

  /**
   * Delay, in milliseconds, after which the `onLongPress` callback gets called.
   * Defaults to 600.
   */
  delayLongPress?: number;
}

export interface RectButtonProps extends BaseButtonProps {
  /**
   * Background color that will be dimmed when button is in active state.
   */
  underlayColor?: string;

  /**
   * iOS only.
   *
   * Opacity applied to the underlay when button is in active state.
   */
  activeOpacity?: number;
}

export interface BorderlessButtonProps extends BaseButtonProps {
  /**
   * iOS only.
   *
   * Opacity applied to the button when it is in an active state.
   */
  activeOpacity?: number;
}

export const RawButton = createNativeWrapper(GestureHandlerButton, {
  shouldCancelWhenOutside: false,
  shouldActivateOnStart: false,
});

export class BaseButton extends React.Component<BaseButtonProps> {
  static defaultProps = {
    delayLongPress: 600,
  };

  private lastActive: boolean;
  private longPressTimeout: ReturnType<typeof setTimeout> | undefined;
  private longPressDetected: boolean;

  constructor(props: BaseButtonProps) {
    super(props);
    this.lastActive = false;
    this.longPressDetected = false;
  }

  private handleEvent = ({
    nativeEvent,
  }: HandlerStateChangeEvent<NativeViewGestureHandlerPayload>) => {
    const { state, oldState, pointerInside } = nativeEvent;
    const active = pointerInside && state === State.ACTIVE;

    if (active !== this.lastActive && this.props.onActiveStateChange) {
      this.props.onActiveStateChange(active);
    }

    if (
      !this.longPressDetected &&
      oldState === State.ACTIVE &&
      state !== State.CANCELLED &&
      this.lastActive &&
      this.props.onPress
    ) {
      this.props.onPress(active);
    }

    if (
      !this.lastActive &&
      // NativeViewGestureHandler sends different events based on platform
      state === (Platform.OS !== 'android' ? State.ACTIVE : State.BEGAN) &&
      pointerInside
    ) {
      this.longPressDetected = false;
      if (this.props.onLongPress) {
        this.longPressTimeout = setTimeout(
          this.onLongPress,
          this.props.delayLongPress
        );
      }
    } else if (
      // cancel longpress timeout if it's set and the finger moved out of the view
      state === State.ACTIVE &&
      !pointerInside &&
      this.longPressTimeout !== undefined
    ) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    } else if (
      // cancel longpress timeout if it's set and the gesture has finished
      this.longPressTimeout !== undefined &&
      (state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED)
    ) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    }

    this.lastActive = active;
  };

  private onLongPress = () => {
    this.longPressDetected = true;
    this.props.onLongPress?.();
  };

  // Normally, the parent would execute it's handler first, then forward the
  // event to listeners. However, here our handler is virtually only forwarding
  // events to listeners, so we reverse the order to keep the proper order of
  // the callbacks (from "raw" ones to "processed").
  private onHandlerStateChange = (
    e: HandlerStateChangeEvent<NativeViewGestureHandlerPayload>
  ) => {
    this.props.onHandlerStateChange?.(e);
    this.handleEvent(e);
  };

  private onGestureEvent = (
    e: GestureEvent<NativeViewGestureHandlerPayload>
  ) => {
    this.props.onGestureEvent?.(e);
    this.handleEvent(
      e as HandlerStateChangeEvent<NativeViewGestureHandlerPayload>
    ); // TODO: maybe it is not correct
  };

  render() {
    const { rippleColor, ...rest } = this.props;

    return (
      <RawButton
        rippleColor={processColor(rippleColor)}
        {...rest}
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onHandlerStateChange}
      />
    );
  }
}

const AnimatedBaseButton = Animated.createAnimatedComponent(BaseButton);

const btnStyles = StyleSheet.create({
  underlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
});

export class RectButton extends React.Component<RectButtonProps> {
  static defaultProps = {
    activeOpacity: 0.105,
    underlayColor: 'black',
  };

  private opacity: Animated.Value;

  constructor(props: RectButtonProps) {
    super(props);
    this.opacity = new Animated.Value(0);
  }

  private onActiveStateChange = (active: boolean) => {
    if (Platform.OS !== 'android') {
      this.opacity.setValue(active ? this.props.activeOpacity! : 0);
    }

    this.props.onActiveStateChange?.(active);
  };

  render() {
    const { children, style, ...rest } = this.props;

    const resolvedStyle = StyleSheet.flatten(style ?? {});

    return (
      <BaseButton
        {...rest}
        style={resolvedStyle}
        onActiveStateChange={this.onActiveStateChange}
      >
        <Animated.View
          style={[
            btnStyles.underlay,
            {
              opacity: this.opacity,
              backgroundColor: this.props.underlayColor,
              borderRadius: resolvedStyle.borderRadius,
              borderTopLeftRadius: resolvedStyle.borderTopLeftRadius,
              borderTopRightRadius: resolvedStyle.borderTopRightRadius,
              borderBottomLeftRadius: resolvedStyle.borderBottomLeftRadius,
              borderBottomRightRadius: resolvedStyle.borderBottomRightRadius,
            },
          ]}
        />
        {children}
      </BaseButton>
    );
  }
}

export class BorderlessButton extends React.Component<BorderlessButtonProps> {
  static defaultProps = {
    activeOpacity: 0.3,
    borderless: true,
  };

  private opacity: Animated.Value;

  constructor(props: BorderlessButtonProps) {
    super(props);
    this.opacity = new Animated.Value(1);
  }

  private onActiveStateChange = (active: boolean) => {
    if (Platform.OS !== 'android') {
      this.opacity.setValue(active ? this.props.activeOpacity! : 1);
    }

    this.props.onActiveStateChange?.(active);
  };

  render() {
    const { children, style, ...rest } = this.props;

    return (
      <AnimatedBaseButton
        {...rest}
        onActiveStateChange={this.onActiveStateChange}
        style={[style, Platform.OS === 'ios' && { opacity: this.opacity }]}
      >
        {children}
      </AnimatedBaseButton>
    );
  }
}

export { default as PureNativeButton } from './GestureHandlerButton';
