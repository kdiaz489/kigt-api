const zendesk = require('node-zendesk');
const sendZendeskTicket = async (request, response) => {
  //   let chargerHelpId = ['360000079852'];
  let client = zendesk.createClient({
    username: 'Jatomis@kigt.co',
    token: '539P7QOj4DqweVB9bTmh0WeAiotKndXlrpt0TrBm',
    remoteUri: 'https://KIGT.zendesk.com/api/v2',
  });
  let ticketData = request.body;
  let ticket = {
    ticket: {
      subject: `Station ${ticketData.charger} - ${ticketData.subject}`,
      comment: { body: ticketData.body },
      priority: ticketData.priority,
    },
  };

  try {
    let res = await client.tickets.create(ticket);
    return response.status(200).json({ success: true, res });
  } catch (error) {
    return response.status(400).json({ success: false, error });
  }
};

module.exports = {
  sendZendeskTicket,
};
