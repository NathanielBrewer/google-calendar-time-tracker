function getFormatedDateTime(date) {
  const dateFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };

  return `${date.toLocaleDateString('en-US', dateFormatOptions)}, ${getFormatedTime(date)}`
};

function getFormatedTime(date) {
  const timeFormatOptions = {
    timeStyle: 'short',
  }
  return `${date.toLocaleTimeString('en-US', timeFormatOptions)}`
}

function createAppEvents(dateRange, appEvents, calendarName) {
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
        Calendar name: ${calendarName}
        Start date: ${getFormatedDateTime(new Date(this.range.start))}
        End date: ${getFormatedDateTime(new Date(this.range.end))}
        Number of events: ${this.appEvents.length}
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
        Title: ${event.getTitle()}        
        Start: ${getFormatedTime(new Date(event.getStartTime()))}
        End: ${getFormatedTime(new Date(event.getEndTime()))}
        Hours: ${getHours()}
      `
    },
  }
}

function getAppEventsForRanges(calendar, dateRanges) {
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

function client_computeResults(calendarId, dateRange) {
  const calendar = CalendarApp.getCalendarById(calendarId);
  if(!calendar) {
    throw new Error(`#client_computeResults(calendarId=${calendarId}, dateRange=${dateRange})
      Calendar not found error
    `);
  }
  const interval = hoursToMs(24);
  const dateRanges = getRangesForInterval(dateRange, interval);
  const appEventsForRanges = getAppEventsForRanges(calendar, dateRanges);
  return createAppEvents(dateRange, appEventsForRanges, calendar.getName()).print();
}


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
    throw new Error(`#getOAuthToken()
      authorization error Failed with error: ${JSON.stringify(e)}
    `);
  }
}

function doGet(event) {
  return HtmlService.createHtmlOutputFromFile('index.html')
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
