import moment from "moment-timezone";


export const START_TIME = moment.tz("2018-03-04 19:00:00", "US/Central");

export function secondsRemaining () {
    return START_TIME.diff(moment()) / 1000;
}
