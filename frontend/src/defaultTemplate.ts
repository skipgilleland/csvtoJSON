// defaultTemplate.ts

// Type definitions
export interface DeliveryOptions {
  email: boolean;
  sms: boolean;
  automatic_disburst: boolean;
  direct_disburse: boolean;
}

export interface FieldValue {
  name: string;
  value: string;
}

export interface PaymentMethodSettings {
  check_postage_type: null;
}

export interface Payee {
  payee_type_id: number;
  amount: number;
  email: string;
  payee_uuid: string;
  first_name: string;
  last_name: string;
  address_one: string;
  address_two: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  delivery_options: DeliveryOptions;
  allowed_payment_method_ids: number[];
  field_values: FieldValue[];
  custom_document_ids: any[];
  permission_required_from: any[];
  payment_method_settings: PaymentMethodSettings;
}

export interface Disbursement {
  payor_email: string;
  disbursement_uuid: string;
  authorization_parties: any[];
  payees: Payee[];
}

export interface DefaultTemplate {
  server: string;
  disbursements: Disbursement[];
}

export interface TemplateField {
  path: string;
  type: string;
  example: string;
  required: boolean;
  description?: string;
}

// Default template
export const defaultTemplate: DefaultTemplate = {
  server: "live",
  disbursements: [
    {
      payor_email: "",
      disbursement_uuid: "",
      authorization_parties: [],
      payees: [
        {
          payee_type_id: 1,
          amount: 0,
          email: "",
          payee_uuid: "",
          first_name: "",
          last_name: "",
          address_one: "",
          address_two: "",
          city: "",
          state: "",
          zip_code: "",
          phone: "",
          delivery_options: {
            email: false,
            sms: true,
            automatic_disburst: false,
            direct_disburse: false
          },
          allowed_payment_method_ids: [1, 2, 3, 4, 5, 6, 7],
          field_values: [
            {
              name: "PolicyNumber",
              value: ""
            },
            {
              name: "CheckNumber",
              value: ""
            }
          ],
          custom_document_ids: [],
          permission_required_from: [],
          payment_method_settings: {
            check_postage_type: null
          }
        }
      ]
    }
  ]
};

// Default template fields for mapping
export const defaultTemplateFields: TemplateField[] = [
  { 
    path: "disbursements[0].payor_email", 
    type: "string", 
    example: "example@company.com",
    required: true
  },
  { 
    path: "disbursements[0].disbursement_uuid", 
    type: "string", 
    example: "9102274",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].amount", 
    type: "number", 
    example: "58.80",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].payee_uuid", 
    type: "string", 
    example: "IN0012454C",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].first_name", 
    type: "string", 
    example: "AUBREE",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].last_name", 
    type: "string", 
    example: "JONES",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].address_one", 
    type: "string", 
    example: "4324",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].address_two", 
    type: "string", 
    example: "S MADISON AVE",
    required: false
  },
  { 
    path: "disbursements[0].payees[0].city", 
    type: "string", 
    example: "ANDERSON",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].state", 
    type: "string", 
    example: "IN",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].zip_code", 
    type: "string", 
    example: "46013",
    required: true
  },
  { 
    path: "disbursements[0].payees[0].phone", 
    type: "string", 
    example: "8125531337",
    required: false
  },
  { 
    path: "disbursements[0].payees[0].field_values[0].value", 
    type: "string", 
    example: "IN0012454C",
    required: true,
    description: "PolicyNumber"
  },
  { 
    path: "disbursements[0].payees[0].field_values[1].value", 
    type: "string", 
    example: "9102274",
    required: true,
    description: "CheckNumber"
  }
];

// Helper function to merge mapped values with template
export const mergeWithTemplate = (mappedValues: Record<string, any>): DefaultTemplate => {
  const result = JSON.parse(JSON.stringify(defaultTemplate));
  
  const setNestedValue = (obj: any, path: string, value: any) => {
    const pathParts = path.match(/[^.\[\]]+/g) || [];
    let current = obj;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const nextPart = pathParts[i + 1];
      const isNextNumber = !isNaN(Number(nextPart));
      
      if (!(part in current)) {
        current[part] = isNextNumber ? [] : {};
      }
      current = current[part];
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    
    // Convert values based on field type
    switch (lastPart) {
      case 'amount':
      case 'payee_type_id':
        current[lastPart] = Number(value);
        break;
      case 'allowed_payment_method_ids':
        current[lastPart] = Array.isArray(value) ? value : [1, 2, 3, 4, 5, 6, 7];
        break;
      default:
        current[lastPart] = value;
    }
  };

  // Apply mapped values
  Object.entries(mappedValues).forEach(([path, value]) => {
    if (value !== undefined && value !== '') {
      setNestedValue(result, path, value);
    }
  });

  return result;
};

// Helper function to extract additional fields from uploaded template
export const extractAdditionalFields = (uploadedTemplate: any): TemplateField[] => {
  const additionalFields: TemplateField[] = [];
  const defaultPaths = new Set(defaultTemplateFields.map(field => field.path));

  const extractFields = (obj: any, path = '') => {
    if (!obj) return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        extractFields(item, `${path}[${index}]`);
      });
      return;
    }

    if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        if (!defaultPaths.has(newPath)) {
          if (typeof value !== 'object' || value === null) {
            additionalFields.push({
              path: newPath,
              type: typeof value,
              example: String(value),
              required: false
            });
          }
        }
        if (typeof value === 'object' && value !== null) {
          extractFields(value, newPath);
        }
      });
    }
  };

  extractFields(uploadedTemplate);
  return additionalFields;
};

// Validate required fields are mapped
export const validateMappings = (mappings: Record<string, any>): { valid: boolean; missingFields: string[] } => {
  const missingFields = defaultTemplateFields
    .filter(field => field.required && !mappings[field.path])
    .map(field => field.path);

  return {
    valid: missingFields.length === 0,
    missingFields
  };
};