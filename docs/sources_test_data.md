## Sources – przykładowe dane do importu (JSON)

Poniżej przykładowy zestaw danych testowych: 4 tabele z różnych baz i schematów, kilka kolumn o różnych typach.

```json
{
  "systems": [
    { "id": "sys_hr", "name": "HR" },
    { "id": "sys_crm", "name": "CRM" }
  ],
  "databases": [
    { "id": "db_hrdta", "systemId": "sys_hr", "name": "hrdta" },
    { "id": "db_payroll", "systemId": "sys_hr", "name": "payroll" },
    { "id": "db_salesdb", "systemId": "sys_crm", "name": "salesdb" },
    { "id": "db_finance", "systemId": "sys_crm", "name": "finance" }
  ],
  "schemas": [
    { "id": "sch_hr_dbo", "databaseId": "db_hrdta", "name": "dbo" },
    { "id": "sch_pay_pay", "databaseId": "db_payroll", "name": "pay" },
    { "id": "sch_sales_sales", "databaseId": "db_salesdb", "name": "sales" },
    { "id": "sch_fin_acc", "databaseId": "db_finance", "name": "acc" }
  ],
  "objects": [
    {
      "id": "obj_employee_t",
      "schemaId": "sch_hr_dbo",
      "name": "employee_t",
      "objectType": "table",
      "rowCount": 120345,
      "comment": "HR employees master table",
      "columns": [
        { "id": "col_emp_id", "objectId": "obj_employee_t", "name": "empl_id", "dataType": { "base": "numeric", "precision": 10, "scale": 0 }, "nullable": false, "isPrimaryKey": true },
        { "id": "col_first_name", "objectId": "obj_employee_t", "name": "first_name", "dataType": { "base": "varchar", "length": 100 }, "nullable": false },
        { "id": "col_last_name", "objectId": "obj_employee_t", "name": "last_name", "dataType": { "base": "varchar", "length": 100 }, "nullable": false },
        { "id": "col_hire_date", "objectId": "obj_employee_t", "name": "hire_date", "dataType": { "base": "date" }, "nullable": false },
        { "id": "col_active", "objectId": "obj_employee_t", "name": "active", "dataType": { "base": "boolean" }, "nullable": false, "defaultValue": "true" }
      ]
    },
    {
      "id": "obj_salary_t",
      "schemaId": "sch_pay_pay",
      "name": "salary_t",
      "objectType": "table",
      "rowCount": 987654,
      "comment": "Payroll salary table",
      "columns": [
        { "id": "col_salary_emp_id", "objectId": "obj_salary_t", "name": "empl_id", "dataType": { "base": "numeric", "precision": 10, "scale": 0 }, "nullable": false, "isPrimaryKey": true, "isForeignKey": true },
        { "id": "col_pay_period", "objectId": "obj_salary_t", "name": "pay_period", "dataType": { "base": "date" }, "nullable": false, "isPrimaryKey": true },
        { "id": "col_gross_amount", "objectId": "obj_salary_t", "name": "gross_amount", "dataType": { "base": "decimal", "precision": 12, "scale": 2 }, "nullable": false },
        { "id": "col_currency", "objectId": "obj_salary_t", "name": "currency", "dataType": { "base": "char", "length": 3 }, "nullable": false },
        { "id": "col_created_at", "objectId": "obj_salary_t", "name": "created_at", "dataType": { "base": "timestamp" }, "nullable": false, "defaultValue": "CURRENT_TIMESTAMP" }
      ]
    },
    {
      "id": "obj_order_t",
      "schemaId": "sch_sales_sales",
      "name": "order_t",
      "objectType": "table",
      "rowCount": 543210,
      "comment": "Sales orders",
      "columns": [
        { "id": "col_order_id", "objectId": "obj_order_t", "name": "order_id", "dataType": { "base": "int" }, "nullable": false, "isPrimaryKey": true },
        { "id": "col_order_customer_id", "objectId": "obj_order_t", "name": "customer_id", "dataType": { "base": "uuid" }, "nullable": false, "isForeignKey": true },
        { "id": "col_order_date", "objectId": "obj_order_t", "name": "order_date", "dataType": { "base": "timestamp" }, "nullable": false },
        { "id": "col_total_amount", "objectId": "obj_order_t", "name": "total_amount", "dataType": { "base": "decimal", "precision": 14, "scale": 2 }, "nullable": false },
        { "id": "col_status", "objectId": "obj_order_t", "name": "status", "dataType": { "base": "varchar", "length": 20 }, "nullable": false, "defaultValue": "'NEW'" }
      ]
    },
    {
      "id": "obj_invoice_t",
      "schemaId": "sch_fin_acc",
      "name": "invoice_t",
      "objectType": "table",
      "rowCount": 22222,
      "comment": "Financial invoices",
      "columns": [
        { "id": "col_invoice_id", "objectId": "obj_invoice_t", "name": "invoice_id", "dataType": { "base": "int" }, "nullable": false, "isPrimaryKey": true },
        { "id": "col_invoice_number", "objectId": "obj_invoice_t", "name": "invoice_number", "dataType": { "base": "varchar", "length": 50 }, "nullable": false },
        { "id": "col_invoice_date", "objectId": "obj_invoice_t", "name": "invoice_date", "dataType": { "base": "date" }, "nullable": false },
        { "id": "col_due_date", "objectId": "obj_invoice_t", "name": "due_date", "dataType": { "base": "date" }, "nullable": true },
        { "id": "col_amount", "objectId": "obj_invoice_t", "name": "amount", "dataType": { "base": "numeric", "precision": 12, "scale": 2 }, "nullable": false },
        { "id": "col_metadata", "objectId": "obj_invoice_t", "name": "metadata", "dataType": { "base": "json" }, "nullable": true }
      ]
    }
  ]
}
```













