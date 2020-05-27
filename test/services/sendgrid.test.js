import 'dotenv/config'
import { sendDynamicMail } from '~/services/sendgrid'
import { serverConfig } from '~/config'

const { emailTemplates } = serverConfig
const email = 'moritz@moritz.com'
const username = 'moritz'
const link = 'link'

describe('SendGrid test Test:', () => {

    test('Dynamic mail', async (done) => {

        await expect(sendDynamicMail({ toEmail: email,
            templateId: emailTemplates.welcome,
            dynamic_template_data: {
                username,
                link
            }
        })).resolves.not.toThrow()
        done()
    })

})
