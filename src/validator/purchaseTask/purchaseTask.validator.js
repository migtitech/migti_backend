import Joi from 'joi'
import { PURCHASE_TASK_STATUS } from '../../models/purchaseTask.model.js'

const purchaseTaskStatusValues = Object.values(PURCHASE_TASK_STATUS)

export const assignPurchaseTaskSchema = Joi.object({
  quotationId: Joi.string().required(),
  assignedTo: Joi.string().required(),
  productCategory: Joi.string().allow('', null).optional(),
  productGroup: Joi.string().allow('', null).optional(),
  subCategory: Joi.string().allow('', null).optional(),
  targetRate: Joi.number().min(0).allow(null).optional(),
  supplierRateRemark: Joi.string().allow('', null).optional(),
})

export const listMyPurchaseTasksSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...purchaseTaskStatusValues).allow('', null).optional(),
})

export const updatePurchaseTaskStatusSchema = Joi.object({
  taskId: Joi.string().required(),
  status: Joi.string().valid(...purchaseTaskStatusValues).required(),
  targetRate: Joi.number().min(0).allow(null).optional(),
})

export const updatePurchaseTaskRemarkSchema = Joi.object({
  taskId: Joi.string().required(),
  supplierRateRemark: Joi.string().allow('', null).required(),
})

export const listRateBucketSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...purchaseTaskStatusValues).allow('', null).optional(),
})

export const adminListPurchaseTasksSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...purchaseTaskStatusValues).allow('', null).optional(),
  employeeId: Joi.string().allow('', null).optional(),
  role: Joi.string().allow('', null).optional(),
})

