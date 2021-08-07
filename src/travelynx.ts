export enum Reason {
  Ping = "ping",
  Checkin = "checkin",
  Update = "update",
  Checkout = "checkout",
  Undo = "undo",
}

export const isReason = (reason: any): reason is Reason =>
  Object.values(Reason).some((v) => v === reason);

export interface Station {
  name: string;
  ds100: string;
  uic: number;
  latitude: number;
  longitude: number;
  scheduledTime: number;
  realTime: number;
}

export const isStation = (station: any): station is Station =>
  typeof station.name === "string" &&
  typeof station.ds100 === "string" &&
  typeof station.uic === "number" &&
  typeof station.latitude === "number" &&
  typeof station.longitude === "number" &&
  typeof station.scheduledTime === "number" &&
  typeof station.realTime === "number";

export type NullStation = { [key in keyof Station]: null };

export const isNullStation = (station: any): station is NullStation =>
  station.name === null &&
  station.ds100 === null &&
  station.uic === null &&
  station.latitude === null &&
  station.longitude === null &&
  station.scheduledTime === null &&
  station.realTime === null;

export interface IntermediateStation {
  name: string;
  scheduledArrival: number | null;
  realArrival: number | null;
  scheduledDeparture: number | null;
  realDeparture: number | null;
}

export const isIntermediateStation = (
  intermediateStation: any
): intermediateStation is IntermediateStation =>
  typeof intermediateStation.name === "string";

export interface Train {
  type: string;
  line: string | null;
  no: string;
  id: string;
}

export const isTrain = (train: any): train is Train =>
  typeof train.type === "string" &&
  typeof train.no === "string" &&
  typeof train.id === "string";

export interface State {
  deprecated: boolean;
  checkedIn: boolean;
  fromStation: Station;
  toStation: Station | NullStation;
  intermediateStops: IntermediateStation[];
  train: Train;
  actionTime: number;
}

export const isState = (state: any): state is State =>
  typeof state.deprecated === "boolean" &&
  typeof state.checkedIn === "boolean" &&
  isStation(state.fromStation) &&
  (isStation(state.toStation) || isNullStation(state.toStation)) &&
  (state as State).intermediateStops.reduce(
    (val, intStop) => isIntermediateStation(intStop) && val,
    true
  ) &&
  isTrain(state.train) &&
  typeof state.actionTime === "number";

export interface Hook {
  reason: Reason;
  status: State;
}

export const isHook = (hook: any): hook is Hook =>
  isReason(hook.reason) && isState(hook.status);

export interface Error {
  error: string;
}

export const isError = (error: any): error is Error =>
  typeof error.error === "string";
