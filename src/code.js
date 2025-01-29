function getFormatedDateTime(date) {
  const dateFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  const timeFormatOptions = {
    timeStyle: 'short',
  }
  return `${date.toLocaleDateString('en-US', dateFormatOptions)}, ${date.toLocaleTimeString('en-US', timeFormatOptions)}`
};

function createAppEvents(dateRange, appEvents) {
  return {
    range: dateRange,
    hours: function () {
      let total = 0;
      appEvents.forEach((event) => {
        total += event.hours;
      });
      return total;
    },
    appEvents: appEvents,
    print: function () {
      return `SUMMARY:
        Start date: ${getFormatedDateTime(new Date(this.range.start))}
        End date: ${getFormatedDateTime(new Date(this.range.end))}
        Total hours: ${this.hours()}

        EVENTS: 
        ${this.appEvents.map((appEvent) => appEvent.print()).join("\n")}`;
    },
  };
}

function createAppEvent(event) {
  function getHours() {
    return getNumHoursInRange({start: event.getStartTime(), end: event.getEndTime()})
  }
  return {
    hours: getHours(),
    event: event,
    print: () => {
      return `Date: ${getFormatedDateTime(new Date(event.getStartTime()))}
        Hours: ${getHours()}
        Title: ${event.getTitle()}
        Start: ${new Date(event.getStartTime()).toLocaleTimeString()}
        End: ${new Date(event.getEndTime()).toLocaleTimeString()}
      `
    },
  }
}

function getAppEventsForRanges(calendar = getCalendarByName(), dateRanges = _dateRanges) {
  if(!calendar) {
    console.error('Error: Calendar not found', CALENDAR_NAME);
    return;
  }
  return dateRanges.map((dateRange) => {
    return calendar.getEvents(dateRange.start, dateRange.end)
      .filter((event) => {
        return !(event.getDescription().includes('not billable') || event.getDescription().includes('Not billable'))
          && !(event.getDescription().includes("don't track") || event.getDescription().includes("Don't track"))
      })
      .map((event) => {
      return createAppEvent(event)
    });
  }).filter((appEventsForRange) => (appEventsForRange && appEventsForRange.length > 0)).flat();
}

function calculateTotalHoursForRangeWithInterval() {
  const dateRange= {
    start: new Date("2024-12-13T00:00:00-04:00").getTime(),
    end: new Date("2025-01-23T23:59:59-04:00").getTime()
  };
  const interval = hoursToMs(24);
  _dateRanges = getRangesForInterval(dateRange, interval);
  const appEventsForRanges = getAppEventsForRanges();
  const appEvents = createAppEvents(dateRange, appEventsForRanges)
  Logger.log(`appEvents: ${appEvents.print()}`);
}

function client_computeResults(calendarId, dateRange) {
  const calendar = CalendarApp.getCalendarById(calendarId);
  const interval = hoursToMs(24);
  const dateRanges = getRangesForInterval(dateRange, interval);
  const appEventsForRanges = getAppEventsForRanges(calendar, dateRanges);
  return createAppEvents(dateRange, appEventsForRanges).print();
}

const CALENDAR_NAME = "New Brunswick Plants";

function getRangesForInterval(dateRange, interval) {
  console.log(`getRangesForInterval(dateRange: ${JSON.stringify(dateRange)}, interval: ${interval})`)
  const ONE_SECOND = 1000;
  const ranges = [];
  let currentTime = dateRange.start;
  while(currentTime < dateRange.end) {
    ranges.push({
      start: new Date(currentTime),
      end: new Date(currentTime + (interval - ONE_SECOND))
    });
    currentTime += interval;
  }
  return ranges;
}

function getCalendarByName(calendarName) {
  return CalendarApp.getCalendarsByName(`${calendarName}`)[0] || null;
}

function getFormatedHoursForRange(dateRange, hours) {
  return `----------------
  Date range: ${JSON.stringify(dateRange, null, 2)}
  Days in range: ${getNumDaysInRange(dateRange)}
  Total hours: ${hours}
  `;
}

function getNumHoursInRange(dateRange) {
  const span = dateRange.end - dateRange.start;
  return span / (1000 * 60 * 60);
}

function getNumDaysFromHours(hours) {
  return Math.round(hours / 24);
}

function getNumDaysInRange(dateRange) {
  return getNumDaysFromHours(getNumHoursInRange(dateRange));
}

var _dateRanges = [
  {
    start: new Date("2024-11-14T00:00:00-04:00"),
    end: new Date("2024-11-17T23:59:59-04:00"),
  },
  {
    start: new Date("2024-11-18T00:00:00-04:00"),
    end: new Date("2024-11-24T23:59:59-04:00"),
  },
  {
    start: new Date("2024-11-25T00:00:00-04:00"),
    end: new Date("2024-12-01T23:59:59-04:00"),
  },
    {
    start: new Date("2024-12-02T00:00:00-04:00"),
    end: new Date("2024-12-08T23:59:59-04:00"),
  },
];

function hoursToMs(hours) {
  return hours * 60 * 60 * 1000;
}

function arrayOfObjectsToCSV(arr) {
  return arr.map(function(d){
    return JSON.stringify(Object.values(d));
  })
  .join('\n') 
  .replace(/(^\[)|(\]$)/mg, '');
}

function client_getOAuthToken() {
  try {
    return ScriptApp.getOAuthToken();
  } catch (e) {
    console.error(`#getOAuthToken()
      authorization error Failed with error: ${JSON.stringify(e)}`);
  }
}

function showWindow() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('index.html')
    .setWidth(600)
    .setHeight(700)
  return htmlOutput
}

function doGet(event) {
  return showWindow()
}

async function client_getSetupData() {
  return {
    calendars: CalendarApp.getAllCalendars().map((calendar) => {
      return {
        name: calendar.getName(),
        id: calendar.getId()
      }
    }),
  }
}
