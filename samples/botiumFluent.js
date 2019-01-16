const BotDriver = require('botium-core').BotDriver

const driver = new BotDriver()

driver.BuildFluent()
  .Start()
  .UserSaysText('Test Signin')
  .WaitBotSaysText((msg) => {
    console.log(msg)
  })
  .UserSaysText('Start Signin')
  .WaitBotSaysText((msg) => {
    console.log(msg)
  })
  .Stop()
  .Clean()
  .Exec()
  .then(() => {
    console.log('READY')
  })
  .catch((err) => {
    console.log('ERROR: ', err)
  })
