import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";

import { Dashboard } from "./dashboard";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { AdminLayout } from "./layout";
import { AdminLoginPage } from "./login";
import {
  LicenseCreate,
  LicenseEdit,
  LicenseList,
  LicenseShow,
} from "./licenses";
import { SettingsPage } from "./settings";
import { theme } from "./theme";
import { UserCreate, UserEdit, UserList, UserShow } from "./users";

function App() {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      dashboard={Dashboard}
      layout={AdminLayout}
      loginPage={AdminLoginPage}
      theme={theme}
      title="Moustass Admin"
    >
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
        create={UserCreate}
        edit={UserEdit}
        recordRepresentation="email"
      />
      <Resource
        name="license"
        list={LicenseList}
        show={LicenseShow}
        create={LicenseCreate}
        edit={LicenseEdit}
        recordRepresentation="clientName"
      />
      <CustomRoutes>
        <Route path="/settings" element={<SettingsPage />} />
      </CustomRoutes>
    </Admin>
  );
}

export default App;
