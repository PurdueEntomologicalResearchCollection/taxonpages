import TaxonWorks from '../services/TaxonWorks'
import { defineStore } from 'pinia'
import { useOtuPageRequest } from '../helpers/useOtuPageRequest'
import { RESPONSE_ERROR } from '../constants'

export const useImageStore = defineStore('imageStore', {
  state: () => {
    return {
      images: null,
      controller: null
    }
  },

  actions: {
    resetRequest() {
      this.controller?.abort()
    },

    async loadImages(otuId) {
      const UNSUPPORTED_FORMAT = ['image/tiff']
      const params = {
        extend: ['depictions', 'attribution', 'source', 'citations'],
        otu_scope: ['all', 'coordinate_otus']
      }

      this.controller = new AbortController()

      try {
        const response = await useOtuPageRequest('panel:images', () =>
          TaxonWorks.getOtuImages(otuId, {
            params,
            signal: this.controller.signal
          })
        )

        this.images = response.data.map((item) => {
          const image = { ...item }
          const { url, project_token } = __APP_ENV__

          if (UNSUPPORTED_FORMAT.includes(image.content_type)) {
            if (item.original_png) {
              image.original = `${url}/${item.original_png?.substring(8)}?project_token=${project_token}`
            }
          }

          return image
        })

        this.controller = null
      } catch (e) {
        if (e.name !== RESPONSE_ERROR.CanceledError) {
          this.controller = null
        }
      }
    }
  }
})
