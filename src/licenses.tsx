import { List, Datagrid, TextField, DateField } from "react-admin";

export const LicenseList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="clientName" />
      <TextField source="serialNumber" />
      <TextField source="maxUsers" />
      <DateField source="expiresAt" />
    </Datagrid>
  </List>
);