

const handleRecurrenceTypeChange = () => {
    const selectedType = document.getElementById('recurrence-type').value;
    const options = document.querySelectorAll('.recurrence-options');

    options.forEach(option => option.style.display = 'none');

    const selectedOptions = document.getElementById(`${selectedType}-options`);
    if (selectedOptions) {
        selectedOptions.style.display = 'block';
    }
}

const handleEndDateChange = () => {
    const endDate = document.getElementById('end-date');
    const endDateOptions = document.getElementById('end-date-options');

    if (endDate.checked) {
        endDateOptions.style.display = 'block';
    } else {
        endDateOptions.style.display = 'none';
    }
}


const handleRecurrenceOptionsChange = () => {
/*
    'none'
    'daily'
    'weekly'
    'workdays'
    'bi-weekly'
    'monthly'
    'yearly'
*/

    const structRecurrenceType = {
        options : 'none',
        daily : {
            interval : 1,
            everyDay : false,
            everyWeekDay : false,
        },
        weekly : {
            interval : 1,
            monday : false,
            tuesday : false,
            wednesday : false,
            thursday : false,
            friday : false,
            saturday : false,
            sunday : false,
        },
        monthly : {
            interval : 1,
            byWeekDay : true,
            weekdayInMonth : 0,
            weekday : 'MO',
            byMonthDay : false,
            monthDays : [],
            monthEndDate : false,
        },
        yearly : {
            interval : 1,
            byYearWeekDay : true,
            weekdayInYear : 0,
            weekday : 'MO',
            month : 1,
        },
        custom : {
            interval : 1,
            byYearWeekDay : true,
            weekdayInYear : 0,
            weekday : 'MO',
            month : 1,
        },
    }

    const recurrenceType = document.getElementById('recurrence-type').value;
    const recurrenceOptions = document.getElementById(`${recurrenceType}-options`) !== null ? document.getElementById(`${recurrenceType}-options`) : false;
    if(!recurrenceOptions) {
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
                else
                {
                    structRecurrenceType[recurrenceType][input.id] = false;
                }
            }
            else if(input.type === 'number') {
                structRecurrenceType[recurrenceType][input.id] = parseInt(input.value);
            }
            else {
                structRecurrenceType[recurrenceType][input.id] = input.value;
            }
        });
    }
   
    return structRecurrenceType;
}

//added to my dom element the recurrence options
const populateRecurrenceOptions = (rRule) => {
    const recurrenceType = document.getElementById('recurrence-type');
    const recurrenceOptions = document.getElementById(`${rRule.options}-options`);
    const recurrenceOptionsInputs = recurrenceOptions.querySelectorAll('input, select, radio')

    recurrenceType.value = rRule.options;
    recurrenceOptions.style.display = 'block';

    recurrenceOptionsInputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = rRule[rRule.options][input.id];
        } 

        else if (input.type === 'radio') {
            if (rRule[rRule.options][input.id]) {
                input.checked = true;
            }
            else
            {
                input.checked = false;
            }
        }
        else if(input.type === 'number') {
            input.value = rRule[rRule.options][input.id];
        }
        else {
            input.value = rRule[rRule.options][input.id];
        }
    });
}

