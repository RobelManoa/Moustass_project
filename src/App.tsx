import { Admin, Resource } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

import { UserList } from "./users";
import { LicenseList } from "./licenses";

const dataProvider = simpleRestProvider("http://localhost:3001");

function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="users" list={UserList} />
      <Resource name="license" list={LicenseList} />
    </Admin>
  );
}

export default App;