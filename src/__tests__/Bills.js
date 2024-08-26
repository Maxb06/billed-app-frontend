/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      // fix : [Ajout de tests unitaires et d'intégration] - composant views/Bills
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });

    // test pour handleClickNewBill
    describe("When I click on the new bill button", () => {
      test("Then it should render NewBill page", () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }); };
        document.body.innerHTML = BillsUI({ data: [] });
        const billsContainer = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
        const buttonNewBill = screen.getByTestId('btn-new-bill');
        buttonNewBill.addEventListener('click', handleClickNewBill);
        fireEvent.click(buttonNewBill);

        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getByTestId('form-new-bill')).toBeTruthy();
      });
    });

    // test pour handleClickIconEye
    describe("When I click on the eye icon", () => {
      test("Then it should open the modal", () => {

        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        const billsContainer = new Bills({ document, onNavigate: null, store: null, localStorage: window.localStorage })
        $.fn.modal = jest.fn()

        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
        iconEye.addEventListener('click', handleClickIconEye)
        fireEvent.click(iconEye)

        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalled()
      });
    });
  });

  // test d'intégration GET
  describe("Given I am connected as an employee", () => {
    describe("When I navigate to Bills", () => {
      test("Then fetches bills from mock API GET for an employee", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();

        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText("Mes notes de frais"));
        const tbodyElements = screen.getAllByTestId('tbody');
        expect(tbodyElements.length).toBe(1);
      });
    });

      describe("When an error occurs on API", () => {
        test("Then fetches bills from mock API GET and handles 404 error", async () => {
          // Simule une erreur 404 de l'API
          mockStore.bills = jest.fn(() => {
            return {
              list: jest.fn().mockRejectedValue(new Error("Erreur 404"))
            };
          });

          localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.append(root);
          router();

          window.onNavigate(ROUTES_PATH.Bills);

          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });

        test("Then fetches bills from mock API GET and handles 500 error", async () => {
          // Simule une erreur 500 de l'API
          mockStore.bills = jest.fn(() => {
            return {
              list: jest.fn().mockRejectedValue(new Error("Erreur 500"))
            };
          });

          localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.append(root);
          router();

          window.onNavigate(ROUTES_PATH.Bills);

          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
