export const state = () => ({
  list: []
})

export const mutations = {
  set(state, settings) {
    state.list = [...settings];
  },
  update(state, setting) {
    state.list = [
      ...state.list.filter(el => el.id !== setting.id),
      setting
    ]
  }
}
