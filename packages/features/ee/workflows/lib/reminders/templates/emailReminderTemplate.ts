import dayjs from "@calcom/dayjs";
import { APP_NAME } from "@calcom/lib/constants";
import { TimeFormat } from "@calcom/lib/timeFormat";
import { WorkflowActions } from "@calcom/prisma/enums";
import type { CalendarEvent } from "@calcom/types/Calendar";
import { guessEventLocationType } from "@calcom/app-store/locations";
import { getVideoCallUrlFromCalEvent } from "@calcom/lib/CalEventParser";
import type { TFunction } from "next-i18next";


const emailReminderTemplate = (
  isEditingMode: boolean,
  action?: WorkflowActions,
  timeFormat?: TimeFormat,
  startTime?: string,
  endTime?: string,
  eventName?: string,
  timeZone?: string,
  otherPerson?: string,
  name?: string,
  isBrandingDisabled?: boolean,
  calEvent?: CalendarEvent,
  t?: TFunction
) => {
  const currentTimeFormat = timeFormat || TimeFormat.TWELVE_HOUR;
  const dateTimeFormat = `ddd, MMM D, YYYY ${currentTimeFormat}`;

  // We would not be able to determine provider name for DefaultEventLocationTypes
  const providerName = guessEventLocationType(calEvent?.location)?.label;
  const location = calEvent?.location;
  let meetingUrl = location?.search(/^https?:/) !== -1 ? location : undefined;
  if (calEvent) {
    meetingUrl = getVideoCallUrlFromCalEvent(calEvent) || meetingUrl;
  }
  const isPhone = location?.startsWith("+");

  let eventDate = "";

  if (isEditingMode) {
    endTime = "{EVENT_END_TIME}";
    eventName = "{EVENT_NAME}";
    timeZone = "{TIMEZONE}";
    otherPerson = action === WorkflowActions.EMAIL_ATTENDEE ? "{ORGANIZER}" : "{ATTENDEE}";
    name = action === WorkflowActions.EMAIL_ATTENDEE ? "{ATTENDEE}" : "{ORGANIZER}";
    eventDate = `{EVENT_DATE_${dateTimeFormat}}`;
  } else {
    eventDate = dayjs(startTime).tz(timeZone).format(dateTimeFormat);

    endTime = dayjs(endTime).tz(timeZone).format(currentTimeFormat);
  }

  const emailSubject = `Reminder: ${eventName} - ${eventDate}`;

  const introHtml = `<body>Hi${
    name ? ` ${name}` : ""
  },<br><br>This is a reminder about your upcoming event.<br><br>`;

  const eventHtml = `<div><strong class="editor-text-bold">Event: </strong></div>${eventName}<br><br>`;

  const dateTimeHtml = `<div><strong class="editor-text-bold">Date & Time: </strong></div>${eventDate} - ${endTime} (${timeZone})<br><br>`;

  const attendeeHtml = `<div><strong class="editor-text-bold">Attendees: </strong></div>You & ${otherPerson}<br><br>`;

  const branding = !isBrandingDisabled && !isEditingMode ? `<br><br>_<br><br>Scheduling by ${APP_NAME}` : "";

  const meetingUrlLink = `<div><strong class="editor-text-bold">Meeting URL: </strong></div><a href="${}">${}</a><br><br>`;

  const endingHtml = `This reminder was triggered by a Workflow in Cal.${branding}</body>`;

  const emailBody = introHtml + eventHtml + dateTimeHtml + attendeeHtml + endingHtml;

  return { emailSubject, emailBody };
};

export default emailReminderTemplate;