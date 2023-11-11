import { Data } from "./index.d"
import StorageManager from "./StorageManager"
import { browser } from "webextension-polyfill-ts"
jest.mock("webextension-polyfill-ts")


describe("StorageManager", () => {
  let inst = new StorageManager()

  beforeEach(() => {
    inst = new StorageManager()
    browser.storage.sync.clear()
    browser.storage.local.clear()
  })

  it("should NOT be busy by default", () => {
    expect(inst.busy).toBe(false)
  })

  it("should get data", async () => {
    const { data } = await inst.getData()

    expect(data).toEqual(inst.defaultData)
  })

  it("should migrate data if sync data available", async () => {
    const oldData: Data = {
      filters: ["label-1"],
      labels: [{ id: "label-1", title: "Work", color: "black" }],
      tasks: {
        "03/02": [
          { id: "1", title: "Test", created_at: "03/02", completed: false }
        ],
        "02/02": [
          { id: "2", title: "Test 2", created_at: "02/02", completed: true }
        ]
      },
      notes: {}
    }

    browser.storage.sync.set(oldData)

    const { data: newData } = await inst.getData()

    expect(newData).toEqual({
      ...oldData,
      migrated: true
    })
  })

  it("should correctly migrate corrupt data", async () => {
    const badData = {
      filters: null,
      tasks: [
        { id: "1", title: "Test", created_at: "03/02", completed: false },
        { id: "2", title: "Test 2", created_at: "02/02", completed: true }
      ],
      notes: []
    }

    browser.storage.sync.set(badData)

    const { data: newData } = await inst.getData()

    expect(newData).toEqual({
      filters: inst.defaultData.filters,
      labels: inst.defaultData.labels,
      tasks: inst.defaultData.tasks,
      notes: inst.defaultData.notes,
      migrated: true
    })
  })

  it("should remove any filters that do not exist", async () => {
    const data: Data = {
      filters: ["does-not-exist"],
      labels: [{ id: "label-1", title: "Work", color: "black" }],
      tasks: {},
      notes: {}
    }

    browser.storage.local.set(data)

    const { data: newData } = await inst.getData()

    expect(newData).toEqual({
      filters: [],
      labels: [{ id: "label-1", title: "Work", color: "black" }],
      tasks: {},
      notes: {}
    })
  })
})
