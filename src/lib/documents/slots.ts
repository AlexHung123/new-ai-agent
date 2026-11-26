export type DocumentSlot = {
  id: string;
  title: string;
  description: string;
  dirName: string;
  /** When true, omit from Agent Document picker; still resolvable for Agent SFC. */
  hiddenFromPicker?: boolean;
};

// Policy trees stay under DOCUMENT_FILES_ROOT for local structured-folder
// reads. To copy them into the Dochub public library, run
// scripts/seed-public-knowledge.sh (does not delete these sources).
export const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: 'spr',
    title: 'Stores and Procurement Regulations (SPR)',
    description: '',
    dirName: 'spr',
  },
  {
    id: 'csr',
    title: 'Civil Service Regulations (CSR)',
    description: '',
    dirName: 'csr',
  },
  {
    id: 'acqn',
    title:
      'Acquisition Procedures for Listing Arrangement for Government Procurement of IT Products (GITP)',
    description: '',
    dirName: 'acqn',
  },
  {
    id: 'department-it-security',
    title: 'Departmental IT Security Policy and Guidelines (DITSP)',
    description: '',
    dirName: 'department-it-security',
  },
  {
    id: 'g3',
    title: 'IT Security Guidelines (G3)',
    description: '',
    dirName: 'g3',
  },
  {
    id: 'rm-manual',
    title: 'Records Management Manual (RMM)',
    description: '',
    dirName: 'rm-manual',
  },
  {
    id: 's17',
    title: 'Baseline IT Security Policy (S17)',
    description: '',
    dirName: 's17',
  },
  {
    id: 'sfc',
    title:
      'Finance Committee Special Meetings written replies on the Estimates of Expenditure (SFC)',
    description: '',
    dirName: 'sfc',
    hiddenFromPicker: true,
  },
  {
    id: 'training-and-development-guide',
    title: 'Training & Development Guide',
    description: '',
    dirName: 'training-and-development-guide',
  },
  {
    id: 'training-guide',
    title: 'Guidelines on Training in the Civil Service (Training Guide)',
    description: '',
    dirName: 'training-guide',
  },
];
