import request from 'request-promise'
import { BadRequestError } from 'restify-errors'

const apiKey = process.env.HERE_API

// https://developer.here.com/documentation/geocoder-autocomplete/dev_guide/topics/quick-start-get-suggestions.html
// eslint-disable-next-line max-len
const autocompleteUrl = `https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json?country=DEU&language=DE&apiKey=${apiKey}`

export const search = async(req, res, next) => {
    try {
        const { suggestions } = await request({ uri: autocompleteUrl, json: true, qs: req.query})
        res.json(suggestions)
    } catch(error) {
        return next(new BadRequestError(error))
    }
}

// https://developer.here.com/documentation/geocoder/dev_guide/topics/quick-start-geocode.html
export const detail = async(req, res, next) => {
    try {
        // dont touch
        const {
            response: {
                view: [
                    { result: [
                        { location }
                    ]}
                ]}} = await request({
            uri: `https://geocoder.ls.hereapi.com/6.2/geocode.json?jsonattributes=1&gen=9&apiKey=${apiKey}`,
            json: true,
            qs: req.query
        })

        res.json(location)
    } catch(error) {
        return next(new BadRequestError(error))
    }
}