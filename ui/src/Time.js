import moment from "moment-timezone";


export const START_TIME = moment.tz("2017-02-26 17:30:00", "US/Pacific");

export function secondsRemaining () {
    return START_TIME.diff(moment()) / 1000;
}
