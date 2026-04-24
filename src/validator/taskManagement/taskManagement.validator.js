import Joi from 'joi'
import {
  TASK_STATUS,
  TASK_PRIORITY,
} from '../../models/taskManagement.model.js'

const taskStatusValues = Object.values(TASK_STATUS)
const taskPriorityValues = Object.values(TASK_PRIORITY)

const productInfoSchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  hsn: Joi.string().allow('', null).optional(),
  gst: Joi.number().min(0).max(100).allow(null).optional(),
  modelNumber: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  image: Joi.string().allow('', null).optional(),
}).unknown(true)

export const createTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  employeeId: Joi.string().allow('', null).optional(),
  branchId: Joi.string().allow('', null).optional(),
  productInfo: productInfoSchema.optional(),
  remark: Joi.string().allow('', null).optional(),
  targetRate: Joi.number().min(0).allow(null).optional(),
  dueDate: Joi.date().allow(null).optional(),
  priority: Joi.string()
    .valid(...taskPriorityValues)
    .optional(),
  status: Joi.string()
    .valid(...taskStatusValues)
    .optional(),
}).unknown(true)

export const listTasksSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid(...taskStatusValues, '')
    .allow('')
    .optional(),
  search: Joi.string().allow('', null).optional(),
  branchId: Joi.string().allow('', null).optional(),
}).unknown(true)

export const listMyTasksSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid(...taskStatusValues, '')
    .allow('')
    .optional(),
  search: Joi.string().allow('', null).optional(),
}).unknown(true)

export const getTaskByIdSchema = Joi.object({
  taskId: Joi.string().required(),
}).unknown(true)

export const assignEmployeeSchema = Joi.object({
  taskId: Joi.string().required(),
  employeeId: Joi.string().required(),
}).unknown(true)

export const updateTaskSupplierSchema = Joi.object({
  taskId: Joi.string().required(),
  supplierId: Joi.string().allow('', null).optional(),
  supplierName: Joi.string().allow('', null).optional(),
  contactName: Joi.string().allow('', null).optional(),
  contactPhone: Joi.string().allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  rate: Joi.number().min(0).allow(null).optional(),
  currency: Joi.string().allow('', null).optional(),
  remark: Joi.string().allow('', null).optional(),
}).unknown(true)

export const updateTaskSchema = Joi.object({
  taskId: Joi.string().required(),
  title: Joi.string().min(1).max(500).trim().optional(),
  productInfo: productInfoSchema.optional(),
  remark: Joi.string().allow('', null).optional(),
  targetRate: Joi.number().min(0).allow(null).optional(),
  dueDate: Joi.date().allow(null).optional(),
  priority: Joi.string()
    .valid(...taskPriorityValues)
    .optional(),
}).unknown(true)
