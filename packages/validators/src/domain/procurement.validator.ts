import { z } from 'zod';

export const createVendorSchema = z.object({
  franchiseGroupId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  name: z.string().min(1),
  contactEmail: z.string().email().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(data => 
  (data.franchiseGroupId !== null && data.restaurantId === null) ||
  (data.franchiseGroupId === null && data.restaurantId !== null),
  { message: 'Must specify exactly one of franchiseGroupId or restaurantId' }
);

export const poLineItemSchema = z.object({
  itemId: z.string().uuid(),
  quantityOrdered: z.number().positive(),
  rawUnitPrice: z.number().min(0),
});

export const createPoSchema = z.object({
  restaurantId: z.string().uuid(),
  vendorId: z.string().uuid(),
  expectedDeliveryDate: z.string().optional().nullable(),
  freightCharge: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  lineItems: z.array(poLineItemSchema).min(1),
});

export const receivePoLineItemSchema = z.object({
  itemId: z.string().uuid(),
  quantityReceived: z.number().min(0),
});

export const receivePoSchema = z.object({
  lineItems: z.array(receivePoLineItemSchema).min(1),
  freightCharge: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
});

export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type PoLineItemDto = z.infer<typeof poLineItemSchema>;
export type CreatePoDto = z.infer<typeof createPoSchema>;
export type ReceivePoLineItemDto = z.infer<typeof receivePoLineItemSchema>;
export type ReceivePoDto = z.infer<typeof receivePoSchema>;
