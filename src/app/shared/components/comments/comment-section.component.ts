import { Component, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  date: string;
  likes: number;
  replies?: Comment[];
  isLiked?: boolean;
}

@Component({
  selector: 'pmst-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comment-section py-8">
      <h3 class="text-2xl font-bold text-gray-900 mb-6">
        Comments ({{ comments().length }})
      </h3>
      
      <!-- Comment Form -->
      <div class="bg-gray-50 rounded-lg p-4 mb-8">
        <div class="flex gap-4">
          <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-indigo-600 font-semibold">Y</span>
          </div>
          <div class="flex-1">
            <textarea 
              [(ngModel)]="newComment"
              placeholder="Write a comment..."
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
            <div class="flex justify-end mt-2">
              <button 
                (click)="postComment()"
                [disabled]="!newComment.trim()"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments List -->
      <div class="space-y-6">
        @for (comment of comments(); track comment.id) {
          <div class="comment-thread">
            <!-- Main Comment -->
            <div class="flex gap-4">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-gray-600 font-semibold">{{ comment.avatar }}</span>
              </div>
              <div class="flex-1">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold text-gray-900">{{ comment.author }}</span>
                    <span class="text-sm text-gray-500">{{ comment.date }}</span>
                  </div>
                  <p class="text-gray-700">{{ comment.content }}</p>
                </div>
                
                <!-- Comment Actions -->
                <div class="flex items-center gap-4 mt-2 ml-2">
                  <button 
                    (click)="likeComment(comment)"
                    class="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                    [class.text-indigo-600]="comment.isLiked"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                    </svg>
                    {{ comment.likes }}
                  </button>
                  <button 
                    (click)="toggleReplyForm(comment.id)"
                    class="text-sm text-gray-500 hover:text-indigo-600"
                  >
                    Reply
                  </button>
                  <button class="text-sm text-gray-500 hover:text-red-600">
                    Flag
                  </button>
                </div>

                <!-- Reply Form -->
                @if (replyingTo() === comment.id) {
                  <div class="mt-4 ml-4">
                    <div class="flex gap-3">
                      <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-indigo-600 text-sm font-semibold">Y</span>
                      </div>
                      <div class="flex-1">
                        <textarea 
                          [(ngModel)]="replyText"
                          placeholder="Write a reply..."
                          rows="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                          <button 
                            (click)="cancelReply()"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button 
                            (click)="postReply(comment.id)"
                            [disabled]="!replyText.trim()"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Nested Replies -->
                @if (comment.replies && comment.replies.length > 0) {
                  <div class="mt-4 ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
                    @for (reply of comment.replies; track reply.id) {
                      <div class="flex gap-3">
                        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span class="text-gray-600 text-sm font-semibold">{{ reply.avatar }}</span>
                        </div>
                        <div class="flex-1">
                          <div class="bg-gray-50 rounded-lg p-3">
                            <div class="flex items-center justify-between mb-1">
                              <span class="font-semibold text-sm text-gray-900">{{ reply.author }}</span>
                              <span class="text-xs text-gray-500">{{ reply.date }}</span>
                            </div>
                            <p class="text-gray-700 text-sm">{{ reply.content }}</p>
                          </div>
                          <div class="flex items-center gap-3 mt-1 ml-2">
                            <button class="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                              </svg>
                              {{ reply.likes }}
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      @if (comments().length === 0) {
        <div class="text-center py-12 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class CommentSectionComponent {
  @Input() contentType: string = 'article';
  @Input() contentId: string = '';

  comments = signal<Comment[]>([
    {
      id: 1,
      author: 'Alice Johnson',
      avatar: 'A',
      content: 'Great article! Very informative about the current situation. Thanks for sharing.',
      date: '2 hours ago',
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: 11,
          author: 'Bob Smith',
          avatar: 'B',
          content: 'I agree! This was really helpful.',
          date: '1 hour ago',
          likes: 3
        }
      ]
    },
    {
      id: 2,
      author: 'Charlie Brown',
      avatar: 'C',
      content: 'Amazing coverage of the event! The photos are stunning.',
      date: '5 hours ago',
      likes: 8,
      isLiked: true,
      replies: []
    }
  ]);

  newComment = '';
  replyText = '';
  replyingTo = signal<number | null>(null);

  postComment(): void {
    if (!this.newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      content: this.newComment,
      date: 'Just now',
      likes: 0,
      replies: []
    };

    this.comments.update(comments => [comment, ...comments]);
    this.newComment = '';
  }

  toggleReplyForm(commentId: number): void {
    this.replyingTo.update(current => current === commentId ? null : commentId);
    this.replyText = '';
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyText = '';
  }

  postReply(parentId: number): void {
    if (!this.replyText.trim()) return;

    const reply: Comment = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      content: this.replyText,
      date: 'Just now',
      likes: 0,
      replies: []
    };

    this.comments.update(comments => 
      comments.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      )
    );

    this.replyText = '';
    this.replyingTo.set(null);
  }

  likeComment(comment: Comment): void {
    this.comments.update(comments =>
      comments.map(c =>
        c.id === comment.id
          ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked }
          : c
      )
    );
  }
}
