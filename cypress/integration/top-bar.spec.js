context("Sage top bar UI", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  context("new node icon", () => {
    it("lets you drag a node onto canvas", () => {
      cy.getSageIframe().find('.proto-node')
        .trigger('mousedown', { which: 1 })

      cy.getSageIframe().find('.ui-droppable')
        .trigger('mousemove')
        .trigger('mouseup', { force: true })

      cy.getSageIframe().find(".ui-droppable").contains(".elm.ui-draggable", "Untitled")
    })
  })

  context("new image icon", () => {
    it("lets you drag a node onto canvas", () => {
      cy.getSageIframe().find('.palette-add-image').click()
      cy.getSageIframe().contains(".modal-dialog-title", "Add new image")
    })
  })
  context("About menu", () => {
    it("opens a menu displaying 'About' and 'Help'", () => {
      cy.getSageIframe().find('.icon-codap-help').click()
      cy.getSageIframe().contains(".menuItem", "About")
      cy.getSageIframe().contains(".menuItem", "Help")
    })
    it ("Will display a splash screen when we click on about", () => {
      cy.getSageIframe().find('.icon-codap-help').click()
      cy.getSageIframe().contains(".menuItem", "About").click()
      cy.getSageIframe().contains("#splash-dialog", "Concord Consortium")
    });
  })

})
