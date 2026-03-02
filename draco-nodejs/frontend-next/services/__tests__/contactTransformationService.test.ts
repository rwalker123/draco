import { describe, expect, it } from 'vitest';
import { ContactTransformationService } from '../contactTransformationService';

describe('ContactTransformationService', () => {
  describe('transformBackendContact', () => {
    it('maps camelCase fields', () => {
      const result = ContactTransformationService.transformBackendContact({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        email: 'john@example.com',
        userId: 'u1',
        photoUrl: 'http://photo.jpg',
        contactroles: [],
      });

      expect(result.id).toBe('1');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.middleName).toBe('Michael');
      expect(result.email).toBe('john@example.com');
      expect(result.userId).toBe('u1');
      expect(result.photoUrl).toBe('http://photo.jpg');
    });

    it('maps lowercase fields from backend', () => {
      const result = ContactTransformationService.transformBackendContact({
        id: '2',
        firstname: 'Jane',
        lastname: 'Smith',
        middlename: 'Marie',
        email: 'jane@example.com',
        userId: '',
        contactroles: [],
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.middleName).toBe('Marie');
    });

    it('prefers lowercase over camelCase when both exist', () => {
      const result = ContactTransformationService.transformBackendContact({
        id: '3',
        firstname: 'Lowercase',
        firstName: 'CamelCase',
        lastname: 'LLast',
        lastName: 'CLast',
        contactroles: [],
      });

      expect(result.firstName).toBe('Lowercase');
      expect(result.lastName).toBe('LLast');
    });

    it('defaults missing fields to empty strings', () => {
      const result = ContactTransformationService.transformBackendContact({});
      expect(result.id).toBe('');
      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
      expect(result.middleName).toBe('');
      expect(result.email).toBe('');
      expect(result.userId).toBe('');
      expect(result.contactroles).toEqual([]);
    });

    it('extracts nested contactDetails', () => {
      const result = ContactTransformationService.transformBackendContact({
        id: '4',
        contactDetails: {
          phone1: '555-1234',
          phone2: '555-5678',
          city: 'Springfield',
          state: 'IL',
        },
        contactroles: [],
      });

      expect(result.contactDetails!.phone1).toBe('555-1234');
      expect(result.contactDetails!.phone2).toBe('555-5678');
      expect(result.contactDetails!.city).toBe('Springfield');
      expect(result.contactDetails!.state).toBe('IL');
    });

    it('extracts flat contact details when no nested object', () => {
      const result = ContactTransformationService.transformBackendContact({
        id: '5',
        phone1: '555-0000',
        streetAddress: '123 Main St',
        contactroles: [],
      });

      expect(result.contactDetails!.phone1).toBe('555-0000');
      expect(result.contactDetails!.streetAddress).toBe('123 Main St');
    });
  });

  describe('transformContactUpdateResponse', () => {
    it('maps ContactUpdateResponse to ContactType', () => {
      const result = ContactTransformationService.transformContactUpdateResponse({
        id: '10',
        firstname: 'Alice',
        lastname: 'Wonder',
        middlename: 'B',
        email: 'alice@example.com',
        phone1: '5551111111',
        phone2: '5552222222',
        phone3: null,
        streetaddress: '456 Elm St',
        city: 'Gotham',
        state: 'NY',
        zip: '10001',
        dateofbirth: '1990-01-01',
        photoUrl: 'http://photo.jpg',
      });

      expect(result.id).toBe('10');
      expect(result.firstName).toBe('Alice');
      expect(result.lastName).toBe('Wonder');
      expect(result.middleName).toBe('B');
      expect(result.email).toBe('alice@example.com');
      expect(result.userId).toBe('');
      expect(result.photoUrl).toBe('http://photo.jpg');
      expect(result.contactDetails!.phone1).toBe('5551111111');
      expect(result.contactDetails!.phone2).toBe('5552222222');
      expect(result.contactDetails!.phone3).toBe('');
      expect(result.contactDetails!.streetAddress).toBe('456 Elm St');
      expect(result.contactDetails!.city).toBe('Gotham');
      expect(result.contactDetails!.state).toBe('NY');
      expect(result.contactDetails!.zip).toBe('10001');
      expect(result.contactDetails!.dateOfBirth).toBe('1990-01-01');
      expect(result.contactroles).toEqual([]);
    });

    it('handles null/undefined optional fields', () => {
      const result = ContactTransformationService.transformContactUpdateResponse({
        id: '11',
        firstname: 'Bob',
        lastname: 'Builder',
        middlename: null,
        email: null,
        photoUrl: null,
      });

      expect(result.middleName).toBe('');
      expect(result.email).toBe('');
      expect(result.photoUrl).toBeUndefined();
    });
  });

  describe('transformContactToUser', () => {
    it('transforms contact to user with roles', () => {
      const contact = {
        id: '20',
        firstName: 'Charlie',
        lastName: 'Brown',
        middleName: 'M',
        email: 'charlie@example.com',
        userId: 'u20',
        photoUrl: 'http://photo.jpg',
        contactDetails: {
          phone1: '555',
          phone2: '',
          phone3: '',
          streetAddress: '',
          city: '',
          state: '',
          zip: '',
          dateOfBirth: '',
        },
        contactroles: [
          {
            id: 'cr1',
            roleId: '93DAC465-4C64-4422-B444-3CE79C549329',
            roleName: 'Administrator',
            roleData: 'data1',
            contextName: 'Context1',
          },
        ],
      };

      const result = ContactTransformationService.transformContactToUser(contact);

      expect(result.id).toBe('20');
      expect(result.firstName).toBe('Charlie');
      expect(result.lastName).toBe('Brown');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].roleId).toBe('93DAC465-4C64-4422-B444-3CE79C549329');
      expect(result.roles[0].roleName).toBe('Administrator');
      expect(result.contactDetails).toBe(contact.contactDetails);
    });

    it('handles empty contactroles', () => {
      const contact = {
        id: '21',
        firstName: 'Test',
        lastName: 'User',
        middleName: '',
        email: '',
        userId: '',
        contactDetails: {
          phone1: '',
          phone2: '',
          phone3: '',
          streetAddress: '',
          city: '',
          state: '',
          zip: '',
          dateOfBirth: '',
        },
        contactroles: [],
      };

      const result = ContactTransformationService.transformContactToUser(contact);
      expect(result.roles).toEqual([]);
    });
  });
});
