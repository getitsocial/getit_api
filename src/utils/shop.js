import { intersection } from 'lodash'

const validSegmentRange = (segment) => (segment.open >= 0 && segment.open <= 1440) && (segment.close >= 0 && segment.close <= 1440)

/*
Rules: 
    0. Only 10 time segments per day (everything else is kinda fishy)
  0,5. Each segment value between 0 and 1440
    1. Don't allow other time segments if it is supposed to be open all day (open = close = 0)
    2. No time segment should have oepn >= close
  2.5. No weird intersections
    3. Only 365 exceptions
    
*/

export const openingHoursValidator = {
    validator: function (openingHours) {
        try {
            // ignore exceptions, handle those separately 
            const days = Object.keys(openingHours).filter(day => day !== 'exceptions')

            for (const day of days) {
                const segments = openingHours[day]

                // Rule 0
                if (segments.length > 10) return false

                // Rule 0,5
                const invalidValue = -1 !== segments.findIndex(segment => !validSegmentRange(segment))
                if (invalidValue) return false

                // Rule 1
                const allDayOpen = -1 !== segments.findIndex(segment => segment.open === 0 && segment.close === 0)
                if (allDayOpen && segments.length > 1) return false                

                // Rule 2
                const badSegments = segments.filter(segment => segment.open >= segment.close)
                if (!allDayOpen && badSegments.length > 0) return false
            
            }
            
            /*             
            // exceptions
            if (openingHours.exceptions !== undefined) { 

                if (Object.keys(openingHours?.exceptions).length > 365) return false

                // const exceptions = Object.keys(openingHours.exceptions)

            } 
            */
             
            
            return true
            
        } catch (error) {
            // log error!
            return false            
        }
    },
    message: () => 'openinghours validation failed'
}


export const parseOpeningHours = (openingHours) => {
    if (openingHours === undefined) return
    
    const parsed = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [], exceptions: {}}

    const days = intersection(Object.keys(openingHours).filter(day => day !== 'exceptions'), ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
 
    for (const day of days) {
        parsed[day] = []
        const segments = openingHours[day]
        for (let index = 0; index < segments.length; index += 1) {
            const segment = segments[index]
            parsed[day].push({ open: HHMMtoMinutes(segment.open), close: HHMMtoMinutes(segment.close)})
        } 

    }
 
    return parsed
}

export const HHMMtoMinutes = (hhmm) => {
    const split = hhmm.split(':')
    if (split.length !== 2) throw 'invalid format'
    return (parseInt(split[0]) * 60) + parseInt(split[1])
}

export const minutesToHHMM = (minutes) => {
    
    const m = minutes % 60    
    const h = (minutes-m) / 60

    return `${h}:${m<10?'0': ''}${m}`
}