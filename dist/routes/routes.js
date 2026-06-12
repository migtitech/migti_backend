"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _index = _interopRequireDefault(require("./admin/index.js"));
var _companyRoutes = _interopRequireDefault(require("./company.routes.js"));
var _companyBranchRoutes = _interopRequireDefault(require("./companyBranch.routes.js"));
var _employeeRoutes = _interopRequireDefault(require("./employee.routes.js"));
var _rawQueryRoutes = _interopRequireDefault(require("./rawQuery.routes.js"));
var _categoryRoutes = _interopRequireDefault(require("./category.routes.js"));
var _groupRoutes = _interopRequireDefault(require("./group.routes.js"));
var _brandRoutes = _interopRequireDefault(require("./brand.routes.js"));
var _productRoutes = _interopRequireDefault(require("./product.routes.js"));
var _supplierRoutes = _interopRequireDefault(require("./supplier.routes.js"));
var _rateCardRoutes = _interopRequireDefault(require("./rateCard.routes.js"));
var _rateMasterRoutes = _interopRequireDefault(require("./rateMaster.routes.js"));
var _areaRoutes = _interopRequireDefault(require("./area.routes.js"));
var _subZoneRoutes = _interopRequireDefault(require("./subZone.routes.js"));
var _industryRoutes = _interopRequireDefault(require("./industry.routes.js"));
var _industryBranchRoutes = _interopRequireDefault(require("./industryBranch.routes.js"));
var _queryRoutes = _interopRequireDefault(require("./query.routes.js"));
var _quotationRoutes = _interopRequireDefault(require("./quotation.routes.js"));
var _purchaseOrderRoutes = _interopRequireDefault(require("./purchaseOrder.routes.js"));
var _poPaymentRoutes = _interopRequireDefault(require("./poPayment.routes.js"));
var _purchaseBillingRequestRoutes = _interopRequireDefault(require("./purchaseBillingRequest.routes.js"));
var _documentRoutes = _interopRequireDefault(require("./document.routes.js"));
var _purchaseTaskRoutes = _interopRequireDefault(require("./purchaseTask.routes.js"));
var _taskManagementRoutes = _interopRequireDefault(require("./taskManagement.routes.js"));
var _queryNewProductRoutes = _interopRequireDefault(require("./queryNewProduct.routes.js"));
var _poBillingRoutes = _interopRequireDefault(require("./poBilling.routes.js"));
var _visitRoutes = _interopRequireDefault(require("./visit.routes.js"));
var _employeeLocationRoutes = _interopRequireDefault(require("./employeeLocation.routes.js"));
var _proBucketRoutes = _interopRequireDefault(require("./proBucket.routes.js"));
var _localProcurementRoutes = _interopRequireDefault(require("./localProcurement.routes.js"));
var _localPurchaseRoutes = _interopRequireDefault(require("./localPurchase.routes.js"));
var _purchaseBucketRoutes = _interopRequireDefault(require("./purchaseBucket.routes.js"));
var _inventoryBucketRoutes = _interopRequireDefault(require("./inventoryBucket.routes.js"));
var _dispatchmentBucketRoutes = _interopRequireDefault(require("./dispatchmentBucket.routes.js"));
var _deliveryApprovalBucketRoutes = _interopRequireDefault(require("./deliveryApprovalBucket.routes.js"));
var _notificationRoutes = _interopRequireDefault(require("./notification.routes.js"));
var _poPaymentBacklogRoutes = _interopRequireDefault(require("./poPaymentBacklog.routes.js"));
var _quotationFollowupRoutes = _interopRequireDefault(require("./quotationFollowup.routes.js"));
var _billingRequestRoutes = _interopRequireDefault(require("./billingRequest.routes.js"));
var _companyDocumentRoutes = _interopRequireDefault(require("./companyDocument.routes.js"));
var _hodDashboardRoutes = _interopRequireDefault(require("./hodDashboard.routes.js"));
var mainRoutes = _express["default"].Router();
mainRoutes.use(function (req, res, next) {
  console.log("Main Routes - ".concat(req.method, " ").concat(req.originalUrl));
  next();
});
mainRoutes.get('/test', function (req, res) {
  res.json({
    success: true,
    message: 'API is working',
    data: {
      timestamp: new Date().toISOString(),
      routes: ['/v1/admin', '/v1/companies', '/v1/company-branches', '/v1/employees', '/v1/raw-queries']
    }
  });
});
mainRoutes.use('/v1', _index["default"]);
mainRoutes.use('/v1/companies', _companyRoutes["default"]);
mainRoutes.use('/v1/company-branches', _companyBranchRoutes["default"]);
mainRoutes.use('/v1/employees', _employeeRoutes["default"]);
mainRoutes.use('/v1/raw-queries', _rawQueryRoutes["default"]);
mainRoutes.use('/v1/categories', _categoryRoutes["default"]);
mainRoutes.use('/v1/groups', _groupRoutes["default"]);
mainRoutes.use('/v1/brands', _brandRoutes["default"]);
mainRoutes.use('/v1/products', _productRoutes["default"]);
mainRoutes.use('/v1/suppliers', _supplierRoutes["default"]);
mainRoutes.use('/v1/rate-cards', _rateCardRoutes["default"]);
mainRoutes.use('/v1/rate-master', _rateMasterRoutes["default"]);
mainRoutes.use('/v1/areas', _areaRoutes["default"]);
mainRoutes.use('/v1/sub-zones', _subZoneRoutes["default"]);
mainRoutes.use('/v1/industries', _industryRoutes["default"]);
mainRoutes.use('/v1/industry-branches', _industryBranchRoutes["default"]);
mainRoutes.use('/v1/queries', _queryRoutes["default"]);
mainRoutes.use('/v1/quotations', _quotationRoutes["default"]);
mainRoutes.use('/v1/purchase-orders', _purchaseOrderRoutes["default"]);
mainRoutes.use('/v1/po-payments', _poPaymentRoutes["default"]);
mainRoutes.use('/v1/purchase-billing-requests', _purchaseBillingRequestRoutes["default"]);
mainRoutes.use('/v1/documents', _documentRoutes["default"]);
mainRoutes.use('/v1/purchase-tasks', _purchaseTaskRoutes["default"]);
mainRoutes.use('/v1/task-management', _taskManagementRoutes["default"]);
mainRoutes.use('/v1/query-new-products', _queryNewProductRoutes["default"]);
mainRoutes.use('/v1/po-billing', _poBillingRoutes["default"]);
mainRoutes.use('/v1/visits', _visitRoutes["default"]);
mainRoutes.use('/v1/employee-locations', _employeeLocationRoutes["default"]);
mainRoutes.use('/v1/pro-bucket', _proBucketRoutes["default"]);
mainRoutes.use('/v1/local-procurement', _localProcurementRoutes["default"]);
mainRoutes.use('/v1/local-purchase', _localPurchaseRoutes["default"]);
mainRoutes.use('/v1/purchase-bucket', _purchaseBucketRoutes["default"]);
mainRoutes.use('/v1/inventory-bucket', _inventoryBucketRoutes["default"]);
mainRoutes.use('/v1/dispatchment-bucket', _dispatchmentBucketRoutes["default"]);
mainRoutes.use('/v1/delivery-approval', _deliveryApprovalBucketRoutes["default"]);
mainRoutes.use('/v1/notifications', _notificationRoutes["default"]);
mainRoutes.use('/v1/po-payment-backlog', _poPaymentBacklogRoutes["default"]);
mainRoutes.use('/v1/quotation-followups', _quotationFollowupRoutes["default"]);
mainRoutes.use('/v1/billing-requests', _billingRequestRoutes["default"]);
mainRoutes.use('/v1/company-documents', _companyDocumentRoutes["default"]);
mainRoutes.use('/v1/hod-dashboard', _hodDashboardRoutes["default"]);
var _default = exports["default"] = mainRoutes;