import { describe, expect, it } from 'vitest';
import { DOCUMENT_SLOTS } from '@/lib/documents/slots';
import { knowledgeFolderDisplayName } from './folderDisplayName';

describe('knowledgeFolderDisplayName', () => {
  it('uses Agent Document catalog titles for root wiki folders', () => {
    expect(knowledgeFolderDisplayName('spr')).toBe(
      'Stores and Procurement Regulations (SPR)',
    );
    expect(knowledgeFolderDisplayName('csr', 'csr')).toBe(
      'Civil Service Regulations (CSR)',
    );
    expect(knowledgeFolderDisplayName('/acqn/')).toBe(
      'Acquisition Procedures for Listing Arrangement for Government Procurement of IT Products (GITP)',
    );
    expect(knowledgeFolderDisplayName('department-it-security')).toBe(
      'Departmental IT Security Policy and Guidelines (DITSP)',
    );
    expect(knowledgeFolderDisplayName('g3')).toBe(
      'IT Security Guidelines (G3)',
    );
    expect(knowledgeFolderDisplayName('rm-manual')).toBe(
      'Records Management Manual (RMM)',
    );
    expect(knowledgeFolderDisplayName('s17')).toBe(
      'Baseline IT Security Policy (S17)',
    );
    expect(knowledgeFolderDisplayName('sfc')).toBe(
      'Finance Committee Special Meetings written replies on the Estimates of Expenditure (SFC)',
    );
    expect(knowledgeFolderDisplayName('training-and-development-guide')).toBe(
      'Training & Development Guide',
    );
    expect(knowledgeFolderDisplayName('training-guide')).toBe(
      'Guidelines on Training in the Civil Service (Training Guide)',
    );
  });

  it('covers every catalog slot and leaves ordinary folders as slugs', () => {
    for (const slot of DOCUMENT_SLOTS) {
      expect(knowledgeFolderDisplayName(slot.dirName)).toBe(slot.title);
      expect(knowledgeFolderDisplayName(slot.id)).toBe(slot.title);
    }
    expect(knowledgeFolderDisplayName('fortesting', 'fortesting')).toBe(
      'fortesting',
    );
    expect(
      knowledgeFolderDisplayName('fortesting/testing123', 'testing123'),
    ).toBe('testing123');
    expect(knowledgeFolderDisplayName('csr/wiki', 'wiki')).toBe('wiki');
    expect(knowledgeFolderDisplayName('notes')).toBe('notes');
  });
});
