import { mergeWith, isArray } from 'lodash'

export const defaultShopData = (edit) => mergeWith({
    name: 'shopname', 
    size: 5, 
    logo: { url: 'https://i.picsum.photos/id/368/200/300.jpg' }, 
    category: 'clothing', 
    contact: { phone: 12345, instagram: 'https://instagram.de', website: 'google.de', facebook: 'facebook.de'}, 
    companyType: 'EU', 
    address: { 
        label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland',
        city: 'Karlsruhe',
        country: 'DEU',
        county: 'Karlsruhe (Stadt)',
        district: 'Weststadt',
        houseNumber: '26',
        locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD',
        state: 'Baden-Württemberg',
        street: 'Goethestrasse',
        postalCode: 76135
    },
    deliveryOptions: ['PU'],
    openingHours: {
        monday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        tuesday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        wednesday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        thursday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        friday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        saturday: [{ open: '9:00', close: '12:00' }, { open: '13:00', close: '18:00' }],
        sunday: []
    }
}, edit, (obj, src) => {
    if (isArray(obj)) return src
})



export const defaultArticleData = (edit) => mergeWith({
    name: 'kebab',
    stock: 3,
    price: 4,
    size: 'thicc',
    currency: 'Euro',
    description: 'mhmhmhmh köftespieß'
}, edit, (obj, src) => {
    if (isArray(obj)) return src
})