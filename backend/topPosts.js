'use strict'

// FB
import { getPostFromFB } from './fb/post'

// Configurations
import { fbConf } from '../config'

// Models
import { TopModel } from './model/top'
import { PostModel } from './model/post'

/**
 * Top posts All-Year.
 */

export const updateTopPosts = async () => {
  const thisYear = new Date(new Date().getFullYear(), 0, 1)
  const post = await PostModel.find({
    'created_on': {
      '$gte': thisYear.getTime(),
      '$lt': Date.now()
    },
    'status.delivered': true
  }).exec()

  await Promise.all(post.map(async (obj) => {

    try {
      await TopModel.remove()

      const postData = await getPostFromFB(obj.postid)

      const regex = new RegExp(`^#${fbConf.page.name}(\\d+)`)
      const id = regex.exec(obj.content)[1]

      const TopEntity = new TopModel({
        _id: id,
        postid: obj.postid,
        likes: postData.likes,
        shares: postData.shares,
        comments: postData.comments,
        totalScore: postData.totalScore
      })

      await TopEntity.save()
    } catch (error) {
      console.log(`[${'!'.red}]  updateTopPost failed.\n\n Details: ${error}\n`)
    }
  }))
}
