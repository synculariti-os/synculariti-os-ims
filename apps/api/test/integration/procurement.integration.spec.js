"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../src/app.module");
const procurement_service_1 = require("../../src/procurement/procurement.service");
const item_service_1 = require("../../src/item/item.service");
const ledger_service_1 = require("../../src/inventory/ledger.service");
(0, vitest_1.describe)('Procurement ACID Integration Tests', () => {
    let app;
    let db;
    let procurementService;
    let itemService;
    let ledgerService;
    (0, vitest_1.beforeAll)(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        db = app.get('DB_CLIENT');
        procurementService = app.get(procurement_service_1.ProcurementService);
        itemService = app.get(item_service_1.ItemService);
        ledgerService = app.get(ledger_service_1.LedgerService);
    });
    (0, vitest_1.afterAll)(async () => {
        if (app) {
            await app.close();
        }
    });
    (0, vitest_1.it)('should successfully boot the application context and connect to the DB', async () => {
        // A placeholder test to ensure CI doesn't fail if there are no integration tests
        // Will be implemented later
        (0, vitest_1.expect)(app).toBeDefined();
        (0, vitest_1.expect)(db).toBeDefined();
    });
});
//# sourceMappingURL=procurement.integration.spec.js.map