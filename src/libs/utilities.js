import Moment from "moment"

export const uuid = () => {
  let dt = new Date().getTime()
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16)
  })
  return uuid
}

export const periodStringFormatter = (type, count) =>
{
  let result = `Unknown (${type}-${count}`

  if (count === 1) {
    switch (type) {
      case "y":
        result = "Annually"
        break
      case "Q":
        result = "Quarterly"
        break
      case "M":
        result = "Monthly"
        break
      case "w":
        result = "Weekly"
        break
      case "d":
        result = "Daily"
        break
      default:
    }
  } else {
    switch (type) {
      case "y":
        if (count === 2) result = "Biannually"
        else result = `${count} yearly`
        break
      case "Q":
        result = `${count} quarterly`
        break
      case "M":
        if (count === 2) result = "Bimonthly"
        else result = `${count} monthly`
        break
      case "w":
        if (count === 2) result = "Fortnightly"
        else result = `${count} weekly`
        break
      case "d":
        result = `Every ${count} days`
        break
      default:
    }
  }
  return result
}

export const today = Moment().startOf('date')
export const beginning = Moment('1970-01-01')