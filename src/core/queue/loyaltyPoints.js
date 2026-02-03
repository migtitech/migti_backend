import Agenda from 'agenda'
import IndividualUserModel from '../../models/individualUser.model.js'
import { Message, statusCodes, errorCodes } from '../common/constant.js'
import CustomError from '../../utils/exception.js'

const agenda = new Agenda({
  db: {
    address: 'mongodb+srv://prod:GCA10102025@gca.tjsqzuq.mongodb.net/gca_prod?retryWrites=true&w=majority&appName=gcaCluster&authSource=admin',
    collection: 'agendaJobs',
  },
  processEvery: '10 seconds',
})

agenda.define('add-loyalty-points', async (job) => {
  try {
    const { referrerUserId, points } = job.attrs.data
    const referrerUser = await IndividualUserModel.findById(referrerUserId)
    if (!referrerUser) {
      console.error(`Referrer user not found: ${referrerUserId}`)
      return
    }
    const updatedUser = await IndividualUserModel.findByIdAndUpdate(
      referrerUserId,
      {
        $inc: { loyaltyPoints: points },
      },
      { new: true }
    ).select('-password')
  } catch (error) {
    console.error('Error processing loyalty points:', error)
    throw error
  }
})

const startAgenda = async () => {
  try {
    await agenda.start()
    console.log('Agenda queue started successfully')
  } catch (error) {
    console.error('Failed to start Agenda:', error)
    throw error
  }
}

const stopAgenda = async () => {
  try {
    await agenda.stop()
    console.log('Agenda queue stopped successfully')
  } catch (error) {
    console.error('Error stopping Agenda:', error)
  }
}

export const addLoyaltyPointsToQueue = async (referrerUserId, points = 10) => {
  try {
    if (!referrerUserId) {
      throw new CustomError(
        statusCodes.badRequest,
        'Referrer user ID is required',
        errorCodes.validation_error
      )
    }

    await agenda.now('add-loyalty-points', {
      referrerUserId,
      points,
    })
    console.log(`Added loyalty points job to queue for user: ${referrerUserId}`)
  } catch (error) {
    console.error('Error adding loyalty points to queue:', error)
    throw error
  }
}

export { agenda, startAgenda, stopAgenda }
