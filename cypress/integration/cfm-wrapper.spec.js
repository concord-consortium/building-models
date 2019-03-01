context("Sage CFM wrapper", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("renders menu with 'Untitled Document'", () => {
    cy.get(".menu-bar").should("contain", "Untitled Document")
  })
})
