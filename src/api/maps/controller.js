import request from 'request-promise'
import { BadRequestError } from 'restify-errors'

const apiKey = process.env.HERE_API

// https://developer.here.com/documentation/geocoder-autocomplete/dev_guide/topics/quick-start-get-suggestions.html
const autocompleteUrl = `https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json?apiKey=${apiKey}`

export const search = async(req, res) => {
    try {
        const { suggestions } = await request({ uri: autocompleteUrl, json: true, qs: req.query})
        res.json(suggestions)
    } catch(error) {
        return next(new BadRequestError(error))
    }
}
