import { RRule } from 'rrule';


export const handleRecurrenceOptionsChange = (recurrenceType, recurrenceOptions) => {
    const structRecurrenceType = {
        options: 'none',
        daily: {
            interval: 1,
            everyDay: false,
            everyWeekDay: false,
        },
        weekly: {
            interval: 1,
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
        },
        monthly: {
            interval: 1,
            byWeekDay: true,
            weekdayInMonth: 0,
            weekday: 'MO',
            byMonthDay: false,
            monthDays: [],
            monthEndDate: false,
        },
        yearly: {
            interval: 1,
            byYearWeekDay: true,
            weekdayInYear: 0,
            weekday: 'MO',
            month: 1,
        },
        custom: {
            interval: 1,
            byYearWeekDay: true,
            weekdayInYear: 0,
            weekday: 'MO',
            month: 1,
        },
    }
    
    if (!recurrenceOptions) {
        return structRecurrenceType
    }

    else {
        const recurrenceOptionsInputs = recurrenceOptions.querySelectorAll('input, select, radio')

        structRecurrenceType.options = recurrenceType;

        recurrenceOptionsInputs.forEach(input => {
            if (input.type === 'checkbox') {
                structRecurrenceType[recurrenceType][input.id] = input.checked;
            }

            else if (input.type === 'radio') {
                if (input.checked) {
                    structRecurrenceType[recurrenceType][input.id] = true;
                }
                else {
                    structRecurrenceType[recurrenceType][input.id] = false;
                }
            }
            else if (input.type === 'number') {
                structRecurrenceType[recurrenceType][input.id] = parseInt(input.value);
            }
            else {
                structRecurrenceType[recurrenceType][input.id] = input.value;
            }
        });

        const endDate = document.getElementById('end-date');
        if (endDate.value) {
            structRecurrenceType.endDate = new Date(endDate.value);
        }

    }
    return convertToRRuleOptions(structRecurrenceType);
}


const convertToRRuleOptions = (recurrenceData) => {
    const rruleOptions = {};

    switch (recurrenceData.options) {
        case 'daily':
            rruleOptions.freq = RRule.DAILY;
            rruleOptions.interval = recurrenceData.daily.interval;
            break;
        case 'weekly':
            rruleOptions.freq = RRule.WEEKLY;
            rruleOptions.interval = recurrenceData.weekly.interval;
            rruleOptions.byweekday = [];
            if (recurrenceData.weekly.monday) rruleOptions.byweekday.push(RRule.MO);
            if (recurrenceData.weekly.tuesday) rruleOptions.byweekday.push(RRule.TU);
            if (recurrenceData.weekly.wednesday) rruleOptions.byweekday.push(RRule.WE);
            if (recurrenceData.weekly.thursday) rruleOptions.byweekday.push(RRule.TH);
            if (recurrenceData.weekly.friday) rruleOptions.byweekday.push(RRule.FR);
            if (recurrenceData.weekly.saturday) rruleOptions.byweekday.push(RRule.SA);
            if (recurrenceData.weekly.sunday) rruleOptions.byweekday.push(RRule.SU);
            break;
        case 'monthly':
            rruleOptions.freq = RRule.MONTHLY;
            rruleOptions.interval = recurrenceData.monthly.interval;
            if (recurrenceData.monthly.byWeekDay) {
                rruleOptions.byweekday = [RRule[recurrenceData.monthly.weekday]];
            } else if (recurrenceData.monthly.byMonthDay) {
                rruleOptions.bymonthday = recurrenceData.monthly.monthDays;
            }
            break;
        case 'yearly':
            rruleOptions.freq = RRule.YEARLY;
            rruleOptions.interval = recurrenceData.yearly.interval;
            rruleOptions.bymonth = [recurrenceData.yearly.month];
            rruleOptions.byweekday = [RRule[recurrenceData.yearly.weekday]];
            break;
        case 'custom':
            // Vous devez décider de la logique pour le cas "custom"
            break;
        default:
            break;
    }
    if (recurrenceData.endDate) {
        rruleOptions.until = recurrenceData.endDate;
    }

    return rruleOptions;
}