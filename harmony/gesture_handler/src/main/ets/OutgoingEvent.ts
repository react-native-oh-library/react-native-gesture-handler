import { State } from "./State"
import { TouchEventType } from "./Event"

export interface GestureEventPayload {
  handlerTag: number;
  numberOfPointers: number;
  state: State;
}

export interface HandlerStateChangeEventPayload extends GestureEventPayload {
  oldState: State;
}

export type GestureUpdateEvent<GestureEventPayloadT = Record<string, unknown>> = GestureEventPayload
  & GestureEventPayloadT

export type GestureStateChangeEvent<GestureStateChangeEventPayloadT = Record<string, unknown>> = HandlerStateChangeEventPayload & GestureStateChangeEventPayloadT

export type TouchData = {
  absoluteX: number;
  absoluteY: number;
  x: number;
  y: number;
  id: number;
};

export type GestureTouchEvent = {
  state: State;
  numberOfTouches: number;
  handlerTag: number;
  eventType: TouchEventType;
  allTouches: TouchData[];
  changedTouches: TouchData[];
};